#!/usr/bin/env node
// Deterministic dogfood of the PUBLISHED package on external repositories.
// Every step records the documented interface, the observed behavior and a verdict, so
// "documented", "implemented" and "verified" stay distinct. No agent is involved.
//
//   node dogfood/dogfood.mjs [--version 1.6.0] [--projects cookie,itsdangerous,...] [--out results/dogfood-<date>]
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, appendFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { SUITE_DIR, ensureSoturail, sanitizedPath } from "../harness/lib.mjs";

const PROJECTS = {
  cookie: { repo: "https://github.com/jshttp/cookie.git", stack: "node", docsLocale: "en", setup: "npm install --no-audit --no-fund", check: "npm test", file: "src/index.ts" },
  itsdangerous: { repo: "https://github.com/pallets/itsdangerous.git", stack: "python", docsLocale: "en", setup: null, check: "python -m pytest -q -p no:cacheprovider tests/test_itsdangerous/test_signer.py tests/test_itsdangerous/test_serializer.py", env: { PYTHONPATH: "src" }, file: "src/itsdangerous/signer.py" },
  "cookie-unicode-path": { repo: "https://github.com/jshttp/cookie.git", stack: "node", docsLocale: "en", setup: "npm install --no-audit --no-fund", check: "npm test", file: "src/index.ts", dirName: "projeto com espaço ção" },
  sotuhire: { repo: "https://github.com/Soturine/SotuHire.git", stack: "python+typescript monorepo", docsLocale: "pt-BR", setup: null, check: "python --version", file: "README.md" },
  replicascan: { repo: "https://github.com/Soturine/replicascan.git", stack: "kotlin/android", docsLocale: "pt-BR", setup: null, check: "gradle test", file: "README.md" },
  // Local, created fresh each run: a brand-new repository (no commit yet) and a directory without Git.
  "fresh-git": { local: "git", stack: "new git repo, no commits, no .gitignore", docsLocale: "en", setup: null, check: "node --version", file: "README.md" },
  "no-git": { local: "plain", stack: "plain directory, no git", docsLocale: "en", setup: null, check: "node --version", file: "index.js" }
};

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const version = opt("version", "1.6.0"); // published version or a local `npm pack` tarball
const label = path.basename(version).replace(/\.tgz$/, "");
const selected = opt("projects", Object.keys(PROJECTS).join(",")).split(",");
const outDir = path.join(SUITE_DIR, opt("out", `results/dogfood-${label}`));
mkdirSync(outDir, { recursive: true });

const soturail = ensureSoturail(version);
const PATH = sanitizedPath([soturail.shimDir]);

function sh(command, cwd, extraEnv = {}, timeoutMs = 600000) {
  const started = Date.now();
  const result = spawnSync(command, { cwd, shell: true, encoding: "utf8", timeout: timeoutMs, windowsHide: true, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PATH, PYTHONUTF8: "1", ...extraEnv } });
  return { code: result.status ?? 124, ms: Date.now() - started, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function cli(cwd, argv, extraEnv = {}) {
  const started = Date.now();
  const result = spawnSync(process.execPath, [soturail.cli, ...argv], { cwd, encoding: "utf8", timeout: 600000, windowsHide: true, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PATH, PYTHONUTF8: "1", ...extraEnv } });
  return { code: result.status ?? 124, ms: Date.now() - started, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function snapshot(dir) {
  const files = new Map();
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      if (entry === ".git" || entry === "node_modules" || entry === ".soturail") continue;
      const full = path.join(current, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else files.set(path.relative(dir, full).replace(/\\/g, "/"), createHash("sha256").update(readFileSync(full)).digest("hex"));
    }
  };
  walk(dir);
  return files;
}

/** Minimal MCP stdio client: newline-delimited JSON-RPC. */
async function mcpSession(cwd, calls) {
  const child = spawn(process.execPath, [soturail.cli, "mcp", "serve", "--transport", "stdio"], { cwd, env: { ...process.env, PATH }, windowsHide: true });
  let buffer = "";
  const pending = new Map();
  child.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (!line) continue;
      try {
        const message = JSON.parse(line);
        if (message.id !== undefined && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
      } catch { /* ignore non-JSON */ }
    }
  });
  let nextId = 1;
  const request = (method, params) => new Promise((resolve) => {
    const id = nextId++;
    const timer = setTimeout(() => { pending.delete(id); resolve({ error: { message: "timeout" } }); }, 30000);
    pending.set(id, (message) => { clearTimeout(timer); resolve(message); });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  });
  const results = [];
  const init = await request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "soturail-dogfood", version: "1" } });
  results.push({ call: "initialize", ok: Boolean(init.result), detail: init.result ? `${init.result.serverInfo?.name} ${init.result.serverInfo?.version} protocol ${init.result.protocolVersion}` : JSON.stringify(init.error) });
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  const list = await request("tools/list", {});
  const tools = list.result?.tools ?? [];
  results.push({ call: "tools/list", ok: tools.length > 0, detail: tools.map((tool) => tool.name).join(", ") });
  for (const [name, input] of calls) {
    const response = await request("tools/call", { name, arguments: input });
    const text = (response.result?.content ?? []).map((part) => part.text ?? "").join("\n");
    const ok = Boolean(response.result) && !response.result.isError;
    results.push({ call: `tools/call ${name}`, ok, detail: (ok ? text : JSON.stringify(response.error ?? response.result)).slice(0, 600), bytes: text.length });
  }
  child.kill();
  return { tools: tools.map((tool) => ({ name: tool.name, required: tool.inputSchema?.required ?? [] })), results };
}

async function dogfood(name) {
  const project = PROJECTS[name];
  const root = path.join(os.tmpdir(), "aq-dogfood", label);
  const dir = path.join(root, project.dirName ?? name);
  const steps = [];
  const step = (id, documented, result, verdict, note = "") => {
    steps.push({ id, documented, code: result?.code ?? null, ms: result?.ms ?? null, verdict, note, outputTail: result ? `${result.stdout}${result.stderr}`.trim().split(/\r?\n/).slice(-6).join("\n").slice(0, 900) : "" });
    process.stdout.write(`  ${verdict.padEnd(5)} ${id}${note ? ` — ${note}` : ""}\n`);
  };
  process.stdout.write(`\n== ${name} (${project.stack}, docs ${project.docsLocale})\n`);

  if (project.local) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, project.file), project.file.endsWith(".js") ? "console.log('hello');\n" : "# demo\n");
    if (project.local === "git") sh("git init -q", dir);
  } else if (!existsSync(path.join(dir, ".git"))) {
    mkdirSync(root, { recursive: true });
    const clone = sh(`git clone -c core.autocrlf=false --depth 1 ${project.repo} "${dir}"`, root);
    if (clone.code !== 0) { step("clone", "-", clone, "ERROR", "clone failed"); return { name, project, steps }; }
  } else {
    sh("git reset -q --hard && git clean -qfdx", dir);
  }
  const head = sh("git rev-parse HEAD", dir).stdout.trim();
  if (project.setup) sh(project.setup, dir, project.env);
  const trackedBefore = sh("git ls-files", dir).stdout.split(/\r?\n/).filter(Boolean).length;
  const before = snapshot(dir);

  // --- onboarding
  const init = cli(dir, ["init"]);
  const afterInit = snapshot(dir);
  const added = [...afterInit.keys()].filter((file) => !before.has(file));
  const modified = [...before.keys()].filter((file) => afterInit.has(file) && afterInit.get(file) !== before.get(file));
  step("init", "soturail init", init, init.code === 0 && modified.length === 0 ? "PASS" : init.code === 0 ? "WARN" : "FAIL", `${added.length} files added outside .soturail/ (${added.filter((f) => f.startsWith("docs/")).length} under docs/), ${modified.length} pre-existing modified${modified.length ? `: ${modified.slice(0, 5).join(", ")}` : ""}`);
  if (project.local === "plain") {
    step("init-gitignore", "runtime state kept out of git", null, "N/A", "no git repository");
  } else {
    // Probe with git itself: runtime state must be ignored, reviewable configuration must not be.
    const probe = [".soturail/raw/x.log", ".soturail/evidence/e/evidence.json", ".soturail/fs/snapshots/s.json", ".soturail/contracts/c.json", ".soturail/config/config.json"];
    const ignoredNow = sh(`git check-ignore --no-index ${probe.join(" ")}`, dir).stdout.split(/\r?\n/).filter(Boolean);
    const runtimeLocal = probe.slice(0, 3).every((item) => ignoredNow.includes(item));
    const configVisible = probe.slice(3).every((item) => !ignoredNow.includes(item));
    step("init-gitignore", "runtime state kept out of git; configuration versionable", null, runtimeLocal && configVisible ? "PASS" : "WARN", `raw/evidence/snapshots ignored=${runtimeLocal}; contracts/config visible=${configVisible}`);
  }

  const doctor = cli(dir, ["doctor"]);
  step("doctor", "soturail doctor", doctor, doctor.code === 0 ? "PASS" : "FAIL");
  const index = cli(dir, ["index"]);
  step("index", "soturail index", index, index.code === 0 ? "PASS" : "FAIL", `${trackedBefore} tracked files, ${Math.round(index.ms / 100) / 10}s`);

  for (const host of ["claude", "codex", "generic"]) {
    const exported = cli(dir, ["skills", "export", "--target", host, "--layout", "portable", "--install", "--json"]);
    let detail = "";
    try { const parsed = JSON.parse(exported.stdout); detail = `${parsed.skills.length} skills -> ${parsed.outDir} (${parsed.host.verification})`; } catch { detail = "non-JSON output"; }
    step(`skills-export-${host}`, `skills export --target ${host} --layout portable --install`, exported, exported.code === 0 && /8 skills/.test(detail) ? "PASS" : "FAIL", detail);
  }

  const discover = cli(dir, ["skills", "discover", "--json"]);
  let skillCount = 0;
  try { const parsed = JSON.parse(discover.stdout); skillCount = (parsed.skills ?? parsed).length; } catch { /* reported below */ }
  step("skills-discover", "skills discover", discover, discover.code === 0 && skillCount >= 8 ? "PASS" : "FAIL", `${skillCount} skills`);

  const caps = cli(dir, ["capabilities", "list", "--json"]);
  let capSummary = "";
  try {
    const parsed = JSON.parse(caps.stdout);
    // `capabilities` is the v1 registry kept for compatibility; the v2 catalog is `catalog`.
    const list = parsed.catalog?.capabilities ?? parsed.capabilities ?? parsed;
    const unavailable = list.filter((cap) => cap.availability === "unavailable").map((cap) => cap.id);
    capSummary = `${list.length} capabilities in v2 catalog (${(parsed.capabilities ?? []).length} in v1 key); unavailable: ${unavailable.join(", ") || "none"}`;
  } catch { capSummary = "non-JSON output"; }
  step("capabilities-list", "capabilities list --json", caps, caps.code === 0 && !/non-JSON/.test(capSummary) ? "PASS" : "FAIL", capSummary);
  const skillIds = new Set();
  for (const file of readdirSync(path.join(dir, ".claude", "skills"))) {
    const text = readFileSync(path.join(dir, ".claude", "skills", file, "SKILL.md"), "utf8");
    for (const id of (text.match(/soturail-uses:\s*(.*)/)?.[1] ?? "").split(/\s+/).filter(Boolean)) skillIds.add(id);
  }
  let listed = new Set();
  try { const parsed = JSON.parse(caps.stdout); listed = new Set((parsed.catalog?.capabilities ?? parsed.capabilities ?? parsed).map((cap) => cap.id)); } catch { /* reported above */ }
  const notListed = [...skillIds].filter((id) => !listed.has(id));
  const describable = notListed.filter((id) => cli(dir, ["capabilities", "describe", id]).code === 0);
  step("skill-capabilities-discoverable", "every capability a skill uses is listed", null, notListed.length === 0 ? "PASS" : "WARN", `${skillIds.size} ids used by skills; ${notListed.length} absent from \`capabilities list\` (${describable.length} resolvable via describe): ${notListed.join(" ")}`);

  const mcpConfig = cli(dir, ["mcp", "config", "--agent", "claude"]);
  const configFile = path.join(dir, ".soturail", "exports", "mcp", "claude", "mcp-config.json");
  const nativeShape = existsSync(configFile) && /"mcpServers"/.test(readFileSync(configFile, "utf8"));
  step("mcp-config-claude", "mcp config --agent claude", mcpConfig, nativeShape ? "PASS" : "WARN", nativeShape ? "host-native mcpServers shape" : "custom shape, not .mcp.json mcpServers; bare `soturail` command (PATH-dependent version)");

  const smoke = cli(dir, ["mcp", "smoke"]);
  step("mcp-smoke", "mcp smoke", smoke, smoke.code === 0 ? "PASS" : "FAIL");

  const mcp = await mcpSession(dir, [
    ["soturail.capabilities", {}],
    ["soturail.skills.list", {}],
    ["soturail.read", { file: project.file, query: "main behavior" }],
    ["soturail.read", { file: "../outside.txt" }],
    ["soturail.index", {}]
  ]);
  for (const result of mcp.results) {
    const outsideCall = result.call === "tools/call soturail.read" && mcp.results.indexOf(result) === 5;
    const verdict = outsideCall ? (!result.ok || /outside|denied|not allowed|escape/i.test(result.detail) ? "PASS" : "FAIL") : result.ok ? "PASS" : "FAIL";
    step(`mcp ${result.call}${outsideCall ? " (path escape)" : ""}`, "MCP stdio", null, verdict, result.detail.slice(0, 160).replace(/\s+/g, " ") + (result.bytes ? ` [${result.bytes} chars]` : ""));
  }

  // --- evidence, contracts, freshness, readiness
  const run = cli(dir, ["run", "--", ...project.check.split(" ")], project.env);
  const direct = sh(project.check, dir, project.env);
  step("run-check", `soturail run -- ${project.check}`, run, run.code === direct.code ? "PASS" : "FAIL", `soturail exit ${run.code}, direct exit ${direct.code}`);

  const contractId = "dogfood-change";
  const create = cli(dir, ["contract", "create", contractId, "--title", "Dogfood change", "--intent", "Exercise contract lifecycle", "--criterion", "project check passes", "--check", project.check, "--criterion-check", project.check], project.env);
  step("contract-create", "contract create", create, create.code === 0 ? "PASS" : "FAIL");
  const contractFile = `.soturail/contracts/${contractId}.json`;
  const verify1 = cli(dir, ["contract", "verify", contractFile], project.env);
  const verdictOf = (result) => { try { const parsed = JSON.parse(result.stdout); return parsed.verdict ?? parsed.readiness?.verdict ?? parsed.status ?? JSON.stringify(parsed).slice(0, 80); } catch { return (result.stdout.match(/(not[-_ ]ready|ready|blocked|stale)/i) ?? ["?"])[0]; } };
  const expected1 = direct.code === 0 ? /^ready$/i : /not|blocked|fail/i;
  const v1 = verdictOf(verify1);
  step("contract-verify-current", "contract verify after a run", verify1, expected1.test(String(v1)) ? "PASS" : "FAIL", `verdict=${v1} (check exit ${direct.code})`);

  appendFileSync(path.join(dir, project.file), "\n");
  const verify2 = cli(dir, ["contract", "verify", contractFile], project.env);
  const v2 = verdictOf(verify2);
  step("freshness-after-edit", "evidence becomes stale after a workspace change", verify2, !/^ready$/i.test(String(v2)) ? "PASS" : "FAIL", `verdict=${v2} after editing ${project.file}`);

  const rerun = cli(dir, ["run", "--", ...project.check.split(" ")], project.env);
  const verify3 = cli(dir, ["contract", "verify", contractFile], project.env);
  const v3 = verdictOf(verify3);
  step("readiness-after-rerun", "fresh run restores readiness", verify3, (rerun.code === 0 ? /^ready$/i : /not|blocked|fail/i).test(String(v3)) ? "PASS" : "FAIL", `verdict=${v3} (rerun exit ${rerun.code}; the edit itself may legitimately break the check)`);

  const selfClaim = cli(dir, ["contract", "verify", contractFile, "--check-passed", "never-ran-this"], project.env);
  step("self-claim-rejected", "caller flags cannot satisfy readiness", selfClaim, !/^ready$/i.test(String(verdictOf(selfClaim))) || selfClaim.code !== 0 ? "PASS" : "FAIL", `verdict=${verdictOf(selfClaim)}`);

  // --- error flows
  const missing = cli(dir, ["read", "does/not/exist.txt"]);
  step("error-read-missing", "clear error for missing file", missing, missing.code !== 0 && missing.stderr.length < 2000 && !/at .*\.js:\d+/.test(missing.stderr) ? "PASS" : "WARN", `${missing.code} ${(missing.stderr || missing.stdout).trim().split(/\r?\n/)[0]?.slice(0, 140)}`);
  const escape = cli(dir, ["read", "../../etc/passwd"]);
  step("error-read-escape", "WorkspaceGuard blocks path escape", escape, escape.code !== 0 ? "PASS" : "FAIL", (escape.stderr || escape.stdout).trim().split(/\r?\n/)[0]?.slice(0, 140));
  const badContract = cli(dir, ["contract", "verify", ".soturail/contracts/nope.json"]);
  step("error-contract-missing", "clear error for missing contract", badContract, badContract.code !== 0 && !/at .*\.js:\d+/.test(badContract.stderr) ? "PASS" : "WARN", (badContract.stderr || badContract.stdout).trim().split(/\r?\n/)[0]?.slice(0, 140));
  const unknownHost = cli(dir, ["skills", "export", "--target", "acme-agent", "--layout", "portable", "--json"]);
  step("unknown-host-fallback", "unknown host -> generic fallback", unknownHost, unknownHost.code === 0 && /generic/.test(unknownHost.stdout) ? "PASS" : "FAIL");

  const status = cli(dir, ["status", "--json"]);
  step("status-json", "status --json", status, status.code === 0 ? "PASS" : "FAIL");

  const untracked = sh("git status --porcelain -uall", dir).stdout.split(/\r?\n/).filter(Boolean);
  const versionable = /\.soturail\/(\.gitignore|config\/config\.json|contracts\/|rules\/|skills\/|specs\/)/;
  const runtimeVisible = untracked.filter((line) => line.includes(".soturail/") && !versionable.test(line));
  step("final-footprint", "-", null, project.local === "plain" ? "N/A" : runtimeVisible.length ? "WARN" : "PASS", `${untracked.length} changed/untracked paths; ${runtimeVisible.length} runtime paths under .soturail/ visible to git`);

  return { name, project, head, trackedBefore, steps, mcpTools: mcp.tools };
}

const results = [];
for (const name of selected) results.push(await dogfood(name));
const summary = {
  schemaVersion: "soturail.qualification.dogfood.v1", soturailVersion: soturail.version, node: process.version, platform: `${process.platform}-${process.arch}`,
  package: version.endsWith(".tgz") ? { tarball: path.basename(version), sha256: createHash("sha256").update(readFileSync(version)).digest("hex") } : { npm: `soturail@${version}` },
  generatedAt: new Date().toISOString(), results
};
writeFileSync(path.join(outDir, "dogfood.json"), `${JSON.stringify(summary, null, 2)}\n`);

const allSteps = [...new Set(results.flatMap((r) => r.steps.map((s) => s.id)))];
const md = [
  `# Dogfood — soturail@${soturail.version}`,
  "",
  `${summary.platform}, Node ${summary.node}, ${summary.generatedAt}. Package: ${summary.package.npm ?? `${summary.package.tarball} (sha256 ${summary.package.sha256})`}, installed in an isolated cache. External projects are shallow clones in the OS temp directory; local projects are created fresh.`,
  "",
  `| step | ${results.map((r) => `${r.name}`).join(" | ")} |`,
  `|---|${results.map(() => "---").join("|")}|`,
  ...allSteps.map((id) => `| ${id} | ${results.map((r) => { const s = r.steps.find((x) => x.id === id); return s ? `${s.verdict}${s.note ? `: ${s.note.replace(/\|/g, "/").slice(0, 110)}` : ""}` : "–"; }).join(" | ")} |`),
  "",
  "Projects: " + results.map((r) => `${r.name} (${r.project.stack}, ${r.project.repo.replace("https://github.com/", "").replace(".git", "")}@${(r.head ?? "").slice(0, 7)})`).join("; "),
  ""
];
writeFileSync(path.join(outDir, "dogfood.md"), md.join("\n"));
process.stdout.write(`\nwrote ${path.relative(SUITE_DIR, outDir)}/dogfood.{json,md}\n`);
