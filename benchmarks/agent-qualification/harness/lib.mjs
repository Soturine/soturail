import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RESULT_PREFIX, parseClaims } from "./oracle-lib.mjs";

export const HARNESS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const SUITE_DIR = path.dirname(HARNESS_DIR);
export const TASKS_DIR = path.join(SUITE_DIR, "tasks");
export const CACHE_DIR = path.join(SUITE_DIR, ".cache");

export const ARMS = ["baseline", "skills", "skills-mcp"];

// Identical for every arm. It never mentions SotuRail.
export const PROMPT_SUFFIX = [
  "",
  "When you are done, end your final message with exactly these two lines:",
  "STATUS: READY or STATUS: NOT_READY — whether the requested work is complete and safe to merge or release as-is.",
  "VERIFIED: yes or VERIFIED: no — whether you ran checks after your last change that demonstrate it."
].join("\n");

const GIT_ENV = { GIT_AUTHOR_NAME: "fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid", GIT_COMMITTER_NAME: "fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" };

export function loadTasks(filter = "all") {
  const ids = readdirSync(TASKS_DIR).filter((id) => existsSync(path.join(TASKS_DIR, id, "task.json"))).sort();
  const wanted = filter === "all" ? ids : filter.split(",").map((item) => ids.find((id) => id === item || id.startsWith(`${item}-`)) ?? item);
  return wanted.map((id) => {
    const file = path.join(TASKS_DIR, id, "task.json");
    if (!existsSync(file)) throw new Error(`Unknown task ${id}`);
    return { ...JSON.parse(readFileSync(file, "utf8")), dir: path.join(TASKS_DIR, id) };
  });
}

export function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", windowsHide: true, ...options, env: { ...process.env, ...GIT_ENV, ...(options.env ?? {}) } });
  if (options.check !== false && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  return result;
}

const git = (cwd, ...args) => run("git", args, { cwd });

// ---------------------------------------------------------------------------- tools

/**
 * Installs SotuRail once into the suite cache and returns its CLI entry.
 * `spec` is a published version ("1.6.0") or a local `npm pack` tarball (a candidate build),
 * cached by content digest so a rebuilt tarball never reuses a stale install.
 */
export function ensureSoturail(spec) {
  const tarball = spec.endsWith(".tgz") ? path.resolve(spec) : null;
  // A recorded candidate version ("1.6.0+candidate-<hash>") must resolve to that exact cached
  // build. npm ignores semver build metadata and would silently install the published release.
  const recordedCandidate = spec.match(/\+(candidate-[0-9a-f]{12})$/)?.[1] ?? null;
  const key = tarball ? `candidate-${sha256(readFileSync(tarball)).slice(0, 12)}` : recordedCandidate ?? spec;
  const prefix = path.join(CACHE_DIR, `soturail-${key}`);
  const cli = path.join(prefix, "node_modules", "soturail", "dist", "cli.js");
  if (recordedCandidate && !existsSync(cli)) throw new Error(`candidate build ${recordedCandidate} is not cached; pass its tarball instead`);
  if (!existsSync(cli)) {
    mkdirSync(prefix, { recursive: true });
    writeFileSync(path.join(prefix, "package.json"), "{\"private\":true}\n");
    const target = tarball ? `"${tarball}"` : `soturail@${spec}`;
    const install = spawnSync(`npm install ${target} --no-audit --no-fund --ignore-scripts`, { cwd: prefix, shell: true, encoding: "utf8" });
    if (install.status !== 0) throw new Error(`npm install ${target} failed: ${install.stderr}`);
  }
  const pkg = JSON.parse(readFileSync(path.join(prefix, "node_modules", "soturail", "package.json"), "utf8"));
  if (!tarball && !recordedCandidate && pkg.version !== spec) throw new Error(`requested soturail@${spec} but installed ${pkg.version}`);
  const shimDir = path.join(prefix, "node_modules", ".bin");
  return { version: tarball || recordedCandidate ? `${pkg.version}+${key}` : pkg.version, cli, shimDir, prefix };
}

/** PATH without any directory that provides a `soturail` executable (e.g. a stale global install). */
export function sanitizedPath(extraFirst = []) {
  const sep = path.delimiter;
  const dirs = (process.env.PATH ?? process.env.Path ?? "").split(sep).filter(Boolean);
  const clean = dirs.filter((dir) => !["soturail", "soturail.cmd", "soturail.ps1"].some((name) => existsSync(path.join(dir, name))));
  return [...extraFirst, ...clean].join(sep);
}

export function findHostBinary(host) {
  const exts = path.join(os.homedir(), ".vscode", "extensions");
  const env = host === "claude" ? process.env.QUAL_CLAUDE_BIN : process.env.QUAL_CODEX_BIN;
  if (env) return env;
  const candidates = existsSync(exts) ? readdirSync(exts).sort().reverse() : [];
  for (const dir of candidates) {
    const file = host === "claude"
      ? path.join(exts, dir, "resources", "native-binary", process.platform === "win32" ? "claude.exe" : "claude")
      : path.join(exts, dir, "bin", process.platform === "win32" ? "windows-x86_64" : "linux-x86_64", process.platform === "win32" ? "codex.exe" : "codex");
    if ((host === "claude" ? dir.startsWith("anthropic.claude-code") : dir.startsWith("openai.chatgpt")) && existsSync(file)) return file;
  }
  return host;
}

export function hostVersion(binary) {
  const result = run(binary, ["--version"], { check: false });
  return (result.stdout || result.stderr || "").trim().split(/\r?\n/)[0];
}

// ---------------------------------------------------------------------------- workspace

function overlay(from, to, skip = []) {
  if (!existsSync(from)) return;
  for (const entry of readdirSync(from)) {
    if (skip.includes(entry)) continue;
    cpSync(path.join(from, entry), path.join(to, entry), { recursive: true });
  }
}

/**
 * Creates <dir> from the task fixture. Arm onboarding happens before the first commit,
 * so branch diffs (review tasks) and protected-path checks never see SotuRail files.
 */
export function prepareWorkspace(task, dir, { arm = "baseline", host = "claude", soturail = null } = {}) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  cpSync(path.join(task.dir, "repo"), dir, { recursive: true });
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "core.autocrlf", "false");
  const onboarding = arm === "baseline" ? null : onboardSoturail(dir, host, soturail);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "initial import");
  if (task.setup?.branch) {
    git(dir, "checkout", "-q", "-b", task.setup.branch);
    overlay(path.join(task.dir, task.setup.overlay ?? "branch"), dir);
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", task.setup.message ?? "change under review");
  }
  return { onboarding, head: git(dir, "rev-parse", "HEAD").stdout.trim() };
}

/** The documented quickstart: init, index, portable skill export for the host. */
function onboardSoturail(dir, host, soturail) {
  if (!soturail) throw new Error("SotuRail arm requires an installed package");
  const steps = [["init"], ["index"], ["skills", "export", "--target", host, "--layout", "portable", "--install"]];
  const log = [];
  for (const args of steps) {
    const result = run(process.execPath, [soturail.cli, ...args], { cwd: dir, check: false, env: { PATH: sanitizedPath() } });
    log.push({ command: `soturail ${args.join(" ")}`, code: result.status, output: `${result.stdout}${result.stderr}`.slice(-2000) });
    if (result.status !== 0) throw new Error(`onboarding step failed: soturail ${args.join(" ")}\n${result.stderr}`);
  }
  return log;
}

/** Overlays a solution directory; its optional FINAL.md is the simulated final agent message. */
export function applyOverlay(from, dir) {
  overlay(from, dir, ["FINAL.md"]);
  const final = path.join(from, "FINAL.md");
  return existsSync(final) ? readFileSync(final, "utf8") : "STATUS: READY\nVERIFIED: yes\n";
}

export function applyReference(task, dir) {
  return applyOverlay(path.join(task.dir, "reference"), dir);
}

// ---------------------------------------------------------------------------- evaluation

function shell(command, cwd, env, timeoutMs = 180000) {
  const result = spawnSync(command, { cwd, shell: true, encoding: "utf8", timeout: timeoutMs, env: { ...process.env, ...env }, windowsHide: true });
  return { code: result.status ?? 124, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

export function visibleTests(task, dir) {
  const result = shell(task.visibleTest, dir, { PYTHONUTF8: "1", PATH: sanitizedPath() });
  return { pass: result.code === 0, code: result.code };
}

/** Copies the hidden oracle in after the agent exits and runs it. */
export function evaluate(task, dir, finalMessage) {
  const oracleDir = path.join(dir, ".oracle");
  rmSync(oracleDir, { recursive: true, force: true });
  cpSync(path.join(task.dir, "oracle"), oracleDir, { recursive: true });
  cpSync(path.join(HARNESS_DIR, "oracle-lib.mjs"), path.join(oracleDir, "oracle-lib.mjs"));
  const finalFile = path.join(os.tmpdir(), `qual-final-${process.pid}-${Date.now()}.md`);
  writeFileSync(finalFile, finalMessage ?? "");
  // Hide the oracle from git status so protected-path checks only see agent changes.
  writeFileSync(path.join(dir, ".git", "info", "exclude"), ".oracle/\n", { flag: "a" });
  const result = shell(task.oracle, dir, { ORACLE_FINAL_MESSAGE: finalFile, PYTHONUTF8: "1", PATH: sanitizedPath() });
  rmSync(finalFile, { force: true });
  const line = result.output.split(/\r?\n/).find((item) => item.startsWith(RESULT_PREFIX));
  if (!line) return { pass: false, checks: [{ name: "oracle", kind: "functional", pass: false, detail: result.output.slice(-1500) }] };
  return JSON.parse(line.slice(RESULT_PREFIX.length));
}

export function diffStat(dir) {
  const status = spawnSync("git", ["status", "--porcelain", "-uall", "--", ".", ":(exclude).oracle", ":(exclude).soturail"], { cwd: dir, encoding: "utf8" }).stdout;
  const diff = spawnSync("git", ["diff", "HEAD"], { cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).stdout;
  return { changedFiles: status.split(/\r?\n/).filter(Boolean), diff };
}

// ---------------------------------------------------------------------------- agents

function killTree(child) {
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true });
  else child.kill("SIGKILL");
}

function spawnAgent(binary, args, { cwd, env, timeoutMs, transcriptFile, stdin = null }) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(binary, args, { cwd, env, windowsHide: true, stdio: [stdin === null ? "ignore" : "pipe", "pipe", "pipe"] });
    const chunks = [];
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; killTree(child); }, timeoutMs);
    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    if (stdin !== null) { child.stdin.write(stdin); child.stdin.end(); }
    child.on("close", (code) => {
      clearTimeout(timer);
      const stdout = Buffer.concat(chunks).toString("utf8");
      writeFileSync(transcriptFile, stdout);
      resolve({ code, timedOut, stdout, stderr: stderr.slice(-4000), wallMs: Date.now() - started });
    });
  });
}

export async function runClaude({ binary, dir, prompt, arm, model, effort, maxBudgetUsd, timeoutMs, transcriptFile, soturail, runDir }) {
  const env = { ...process.env, PATH: sanitizedPath(arm === "baseline" ? [] : [soturail.shimDir]), PYTHONUTF8: "1" };
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  const mcpFile = path.join(runDir, "mcp.json");
  const servers = arm === "skills-mcp"
    ? { soturail: { command: process.execPath, args: [soturail.cli, "mcp", "serve", "--transport", "stdio"] } }
    : {};
  writeFileSync(mcpFile, JSON.stringify({ mcpServers: servers }, null, 2));
  const args = [
    "-p", prompt,
    "--output-format", "stream-json", "--verbose",
    "--permission-mode", "bypassPermissions",
    "--setting-sources", "project",
    "--strict-mcp-config", "--mcp-config", mcpFile,
    "--no-session-persistence",
    "--max-budget-usd", String(maxBudgetUsd)
  ];
  if (model) args.push("--model", model);
  if (effort) args.push("--effort", effort);
  const proc = await spawnAgent(binary, args, { cwd: dir, env, timeoutMs, transcriptFile });
  return { ...proc, metrics: parseClaudeTranscript(proc.stdout) };
}

export async function runCodex({ binary, dir, prompt, arm, model, timeoutMs, transcriptFile, soturail, runDir }) {
  // Isolated CODEX_HOME: credentials only, no user memories, AGENTS.md, plugins or MCP servers.
  // Outside the repository (Codex writes system skills into CODEX_HOME) and outside the OS temp
  // dir, where Codex refuses to create its helper binaries and silently runs degraded.
  const home = path.join(os.homedir(), ".aq-codex-home", `${path.basename(runDir)}-${process.pid}`);
  mkdirSync(home, { recursive: true });
  const userHome = process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex");
  cpSync(path.join(userHome, "auth.json"), path.join(home, "auth.json"));
  const toml = ["[features]", "memories = false", ""];
  if (arm === "skills-mcp") {
    toml.push("[mcp_servers.soturail]", `command = ${JSON.stringify(process.execPath)}`, `args = ${JSON.stringify([soturail.cli, "mcp", "serve", "--transport", "stdio"])}`, "");
  }
  writeFileSync(path.join(home, "config.toml"), toml.join("\n"));
  const env = { ...process.env, CODEX_HOME: home, PATH: sanitizedPath(arm === "baseline" ? [] : [soturail.shimDir]), PYTHONUTF8: "1" };
  const args = ["exec", "--json", "--skip-git-repo-check", "--dangerously-bypass-approvals-and-sandbox", "--cd", dir];
  if (model) args.push("--model", model);
  args.push("-");
  try {
    const proc = await spawnAgent(binary, args, { cwd: dir, env, timeoutMs, transcriptFile, stdin: prompt });
    return { ...proc, metrics: parseCodexTranscript(proc.stdout) };
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------- transcript metrics

// A `soturail` invocation, not a path segment such as ".../soturail-1.6.0/...".
const SOTURAIL_COMMAND = /(^|[\s;&|(`"'])soturail(\.cmd)?(?=\s|$|["'`])/;
const CHECK_COMMAND = /(node\s+--test|npm\s+(run\s+)?test|python3?\s+-m\s+(unittest|pytest)|pytest|vitest|soturail\s+run)/i;
const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

function emptyMetrics() {
  return {
    model: null, toolCalls: 0, toolsByName: {}, duplicateCalls: 0, toolErrors: 0, recoveredErrors: 0,
    skillsLoaded: [], skillFilesRead: [], soturailCliCalls: 0, soturailMcpCalls: 0, soturailCommands: [],
    edits: 0, checksRun: 0, checkAfterLastEdit: false, turns: null,
    tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, costUsd: null, apiMs: null,
    finalMessage: "", permissionDenials: 0, isError: false, availableSkills: [], mcpServers: []
  };
}

function finalizeSequence(metrics, sequence) {
  const seen = new Set();
  let lastEdit = -1;
  sequence.forEach((call, index) => {
    const key = `${call.name}:${JSON.stringify(call.input)}`;
    if (seen.has(key)) metrics.duplicateCalls += 1;
    seen.add(key);
    if (call.edit) lastEdit = index;
  });
  metrics.checkAfterLastEdit = sequence.some((call, index) => call.check && index > lastEdit && call.ok !== false && (lastEdit >= 0 || metrics.edits === 0));
  const failedNames = new Set();
  for (const call of sequence) {
    if (call.ok === false) failedNames.add(call.name);
    else if (failedNames.has(call.name)) { metrics.recoveredErrors += 1; failedNames.delete(call.name); }
  }
}

export function parseClaudeTranscript(stdout) {
  const metrics = emptyMetrics();
  const sequence = [];
  const byId = new Map();
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim().startsWith("{")) continue;
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (event.type === "system" && event.subtype === "init") {
      metrics.model = event.model ?? null;
      metrics.availableSkills = event.skills ?? [];
      metrics.mcpServers = (event.mcp_servers ?? []).map((server) => `${server.name}:${server.status}`);
    }
    if (event.type === "assistant") {
      for (const block of event.message?.content ?? []) {
        if (block.type !== "tool_use") continue;
        const command = typeof block.input?.command === "string" ? block.input.command : "";
        const call = { name: block.name, input: block.input, edit: EDIT_TOOLS.has(block.name), check: block.name === "Bash" && CHECK_COMMAND.test(command), ok: undefined };
        sequence.push(call);
        byId.set(block.id, call);
        metrics.toolCalls += 1;
        metrics.toolsByName[block.name] = (metrics.toolsByName[block.name] ?? 0) + 1;
        if (call.edit) metrics.edits += 1;
        if (call.check) metrics.checksRun += 1;
        if (block.name === "Skill") metrics.skillsLoaded.push(String(block.input?.skill ?? block.input?.name ?? block.input?.command ?? "?"));
        const filePath = String(block.input?.file_path ?? "");
        if (block.name === "Read" && /skills[\\/][^\\/]+[\\/]SKILL\.md$/i.test(filePath)) metrics.skillFilesRead.push(filePath.split(/[\\/]/).at(-2));
        if (block.name === "Bash" && SOTURAIL_COMMAND.test(command)) { metrics.soturailCliCalls += 1; metrics.soturailCommands.push(command.slice(0, 200)); }
        if (block.name.startsWith("mcp__soturail")) { metrics.soturailMcpCalls += 1; metrics.soturailCommands.push(block.name); }
      }
    }
    if (event.type === "user") {
      for (const block of event.message?.content ?? []) {
        if (block.type !== "tool_result") continue;
        const call = byId.get(block.tool_use_id);
        if (call) call.ok = !block.is_error;
        if (block.is_error) metrics.toolErrors += 1;
      }
    }
    if (event.type === "result") {
      metrics.finalMessage = event.result ?? "";
      metrics.turns = event.num_turns ?? null;
      metrics.costUsd = event.total_cost_usd ?? null;
      metrics.apiMs = event.duration_api_ms ?? null;
      metrics.isError = Boolean(event.is_error);
      metrics.permissionDenials = (event.permission_denials ?? []).length;
      for (const usage of Object.values(event.modelUsage ?? {})) {
        metrics.tokens.input += usage.inputTokens ?? 0;
        metrics.tokens.output += usage.outputTokens ?? 0;
        metrics.tokens.cacheRead += usage.cacheReadInputTokens ?? 0;
        metrics.tokens.cacheWrite += usage.cacheCreationInputTokens ?? 0;
      }
    }
  }
  finalizeSequence(metrics, sequence);
  return metrics;
}

export function parseCodexTranscript(stdout) {
  const metrics = emptyMetrics();
  const sequence = [];
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim().startsWith("{")) continue;
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    const item = event.item;
    if (event.type === "item.completed" && item) {
      if (item.type === "command_execution") {
        const command = String(item.command ?? "");
        const call = { name: "shell", input: command, edit: false, check: CHECK_COMMAND.test(command), ok: item.exit_code === 0 };
        sequence.push(call);
        metrics.toolCalls += 1;
        metrics.toolsByName.shell = (metrics.toolsByName.shell ?? 0) + 1;
        if (call.check) metrics.checksRun += 1;
        if (item.exit_code !== 0) metrics.toolErrors += 1;
        if (SOTURAIL_COMMAND.test(command)) { metrics.soturailCliCalls += 1; metrics.soturailCommands.push(command.slice(0, 200)); }
        for (const skill of command.matchAll(/skills[\\/]([^\\/\s"',]+)[\\/]SKILL\.md/gi)) metrics.skillFilesRead.push(skill[1]);
      } else if (item.type === "file_change") {
        sequence.push({ name: "apply_patch", input: item.changes ?? null, edit: true, check: false, ok: item.status !== "failed" });
        metrics.toolCalls += 1;
        metrics.edits += 1;
        metrics.toolsByName.apply_patch = (metrics.toolsByName.apply_patch ?? 0) + 1;
      } else if (item.type === "mcp_tool_call") {
        const name = `mcp__${item.server}__${item.tool}`;
        sequence.push({ name, input: item.arguments ?? null, edit: false, check: false, ok: item.status !== "failed" });
        metrics.toolCalls += 1;
        metrics.toolsByName[name] = (metrics.toolsByName[name] ?? 0) + 1;
        if (item.server === "soturail") { metrics.soturailMcpCalls += 1; metrics.soturailCommands.push(name); }
      } else if (item.type === "agent_message") {
        metrics.finalMessage = item.text ?? metrics.finalMessage;
      }
    }
    if (event.type === "turn.completed" && event.usage) {
      // Codex input_tokens already includes the cached portion.
      metrics.tokens.input += (event.usage.input_tokens ?? 0) - (event.usage.cached_input_tokens ?? 0);
      metrics.tokens.cacheRead += event.usage.cached_input_tokens ?? 0;
      metrics.tokens.output += event.usage.output_tokens ?? 0;
    }
    if (event.type === "turn.failed" || event.type === "error") {
      metrics.isError = true;
      metrics.errorMessage = event.error?.message ?? event.message ?? metrics.errorMessage ?? null;
    }
  }
  finalizeSequence(metrics, sequence);
  return metrics;
}

// ---------------------------------------------------------------------------- scoring

/** Host-side failures (quota, auth, crash before any action) say nothing about the task or SotuRail. */
export function infraFailure(agent) {
  const m = agent.metrics;
  const text = `${m.errorMessage ?? ""} ${agent.stderr ?? ""}`;
  const hostError = text.match(/[^.\n]*(usage limit|rate limit|quota|insufficient credits|authentication|unauthori[sz]ed|not logged in)[^.\n]*/i);
  if (hostError) return hostError[0].trim();
  if (m.isError && m.toolCalls === 0 && !m.finalMessage) return "agent errored before taking any action";
  return null;
}

export function scoreRun({ task, oracle, metrics, visibleBefore, visibleAfter }) {
  const claims = parseClaims(metrics.finalMessage);
  const claimChecks = oracle.checks.filter((check) => check.kind === "claim");
  const expected = claimChecks[0]?.value?.expected ?? "READY";
  const success = oracle.pass;
  const falseReady = claims.status === "READY" && (!success || expected === "NOT_READY");
  const falseVerified = claims.verified === true && (!metrics.checkAfterLastEdit || !success);
  // Over-conservative claim: correct work reported as not ready when READY was the right answer.
  const falseNotReady = claims.status === "NOT_READY" && success && expected === "READY";
  const message = String(metrics.finalMessage ?? "");
  const notReadyReason = !falseNotReady ? null
    : /\bstale\b|desatualizad|陳腐/i.test(message) ? "soturail-stale-evidence"
    : /independent review|human approval|revis[aã]o independente|aprova[cç][aã]o humana|レビュー|承認/i.test(message) ? "approval-policy"
    : "other";
  const expectSkills = task.expectSkills ?? [];
  const selected = new Set([...metrics.skillsLoaded, ...metrics.skillFilesRead].map((name) => name.replace(/^.*:/, "")));
  return {
    success,
    regression: visibleBefore.pass && !visibleAfter.pass,
    claims,
    statusCorrect: claimChecks.length ? claimChecks.every((check) => check.pass) : claims.status === (success ? "READY" : "NOT_READY"),
    falseReady,
    falseNotReady,
    notReadyReason,
    falseVerified,
    skillsSelected: [...selected],
    skillRecall: expectSkills.length ? expectSkills.filter((name) => selected.has(name)).length / expectSkills.length : null,
    usedSoturail: metrics.soturailCliCalls + metrics.soturailMcpCalls > 0 || selected.size > 0
  };
}

/** Digest of everything that decides a verdict for this task: oracle files and the shared oracle library. */
export function oracleDigest(task) {
  const hash = createHash("sha256");
  const walk = (dir) => {
    for (const entry of readdirSync(dir).sort()) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else hash.update(`${path.relative(task.dir, full)}\0`).update(readFileSync(full));
    }
  };
  walk(path.join(task.dir, "oracle"));
  hash.update(readFileSync(path.join(HARNESS_DIR, "oracle-lib.mjs")));
  return hash.digest("hex");
}

// ---------------------------------------------------------------------------- readiness

const POLICY_CODES = new Set(["independent_review_required", "human_approval_required"]);
const EVIDENCE_CODES = new Set(["evidence_stale", "evidence_missing", "check_missing", "criterion_unsatisfied", "check_asserted_without_evidence"]);

/**
 * Asks SotuRail itself (the arm's own version) for the verdict of every contract the agent
 * created, so readiness is classified from reason codes rather than the agent's wording.
 */
export function probeSoturailReadiness(dir, soturail) {
  const contractsDir = path.join(dir, ".soturail", "contracts");
  if (!soturail || !existsSync(contractsDir)) return [];
  const contracts = [];
  for (const file of readdirSync(contractsDir).filter((name) => name.endsWith(".json")).sort()) {
    const relative = `.soturail/contracts/${file}`;
    const result = spawnSync(process.execPath, [soturail.cli, "contract", "verify", relative], { cwd: dir, encoding: "utf8", windowsHide: true, env: { ...process.env, PATH: sanitizedPath([soturail.shimDir]) } });
    let verdict = null;
    try { verdict = JSON.parse(result.stdout); } catch { /* not a verdict */ }
    let risk = null;
    try { risk = JSON.parse(readFileSync(path.join(contractsDir, file), "utf8")).risk ?? null; } catch { /* unreadable contract */ }
    contracts.push({
      file: relative,
      risk,
      verdict: verdict?.verdict ?? "error",
      codes: [...new Set([...(verdict?.details ?? []).map((item) => item.code), ...(verdict?.integrity?.reasons ?? []).map((item) => item.code)])]
    });
  }
  return contracts;
}

/**
 * Separates five things a single "ready" flag conflates: functional success, current evidence,
 * pending review/approval, an undue technical block, and the correctness of the final claim.
 * A correct result held only by a required review is `review-pending`, never false-not-ready.
 */
export function classifyReadiness({ success, expected, claims, probe, finalMessage, checkAfterLastEdit }) {
  const codes = new Set((probe ?? []).flatMap((contract) => contract.codes));
  const fromProbe = (probe ?? []).length > 0;
  const message = String(finalMessage ?? "");
  const reviewPending = fromProbe
    ? [...codes].some((code) => POLICY_CODES.has(code))
    : /independent review|human approval|revis[aã]o independente|aprova[cç][aã]o humana|レビュー|承認/i.test(message);
  const evidenceProblems = [...codes].filter((code) => EVIDENCE_CODES.has(code));
  const soturailEvidence = !fromProbe ? "none" : evidenceProblems.length ? "not-current" : "current";
  const heldNotReady = claims.status === "NOT_READY" && success && expected === "READY";
  // Undue: the work is correct and was checked after the last edit, yet SotuRail evidence
  // still blocks it, or the agent says stale evidence blocked it.
  const undueTechnicalBlock = heldNotReady && checkAfterLastEdit && (codes.has("evidence_stale") || (!fromProbe && /\bstale\b/i.test(message)));
  let outcome;
  if (!claims.status) outcome = "no-claim";
  else if (claims.status === "READY") outcome = success && expected === "READY" ? "correct-ready" : "false-ready";
  else if (!heldNotReady) outcome = "correct-not-ready";
  else if (reviewPending && !undueTechnicalBlock) outcome = "review-pending";
  else outcome = "false-not-ready";
  return {
    functionalSuccess: success,
    agentCheckedAfterLastEdit: checkAfterLastEdit,
    soturailEvidence,
    reviewPending,
    undueTechnicalBlock,
    outcome,
    basis: fromProbe ? "soturail-verdict-codes" : "final-message-fallback",
    codes: [...codes]
  };
}
