import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface ReleaseGateResult {
  id: string;
  label: string;
  ok: boolean;
  required: boolean;
  details: string;
}

export interface ReleasePreflightResult {
  ok: boolean;
  version: string | null;
  packageName: string | null;
  fullAuditDevOnly: boolean;
  fullAuditFindings: string[];
  gates: ReleaseGateResult[];
}

export interface ReleasePreflightOptions {
  runAudit?: boolean;
  runPack?: boolean;
  cliCommand?: string[];
}

interface ProcessResult {
  code: number;
  stdout: string;
  stderr: string;
}

interface AuditSummary {
  total: number;
  names: string[];
}

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export async function runReleasePreflight(
  root = process.cwd(),
  options: ReleasePreflightOptions = {}
): Promise<ReleasePreflightResult> {
  const resolvedRoot = path.resolve(root);
  const runAudit = options.runAudit ?? true;
  const runPack = options.runPack ?? true;
  const gates: ReleaseGateResult[] = [];
  const packageJson = await readOptionalJson(path.join(resolvedRoot, "package.json"));
  const packageName = typeof packageJson?.name === "string" ? packageJson.name : null;
  const version = typeof packageJson?.version === "string" ? packageJson.version : null;

  addGate(gates, "package_version", "package.json version", Boolean(version && SEMVER_PATTERN.test(version)), version ?? "missing");

  const packageLock = await readOptionalJson(path.join(resolvedRoot, "package-lock.json"));
  const lockVersion = typeof packageLock?.version === "string" ? packageLock.version : null;
  const lockRootVersion = packageLock && typeof packageLock === "object"
    && "packages" in packageLock
    && packageLock.packages
    && typeof packageLock.packages === "object"
    && "" in packageLock.packages
    && packageLock.packages[""]
    && typeof packageLock.packages[""] === "object"
    && "version" in packageLock.packages[""]
    && typeof packageLock.packages[""].version === "string"
    ? packageLock.packages[""].version
    : null;
  addGate(
    gates,
    "package_lock_version",
    "package-lock version sync",
    Boolean(version && lockVersion === version && lockRootVersion === version),
    `package-lock.version=${lockVersion ?? "missing"}, packages[\"\"].version=${lockRootVersion ?? "missing"}`
  );

  const cliVersion = await readCliVersion(resolvedRoot, options.cliCommand);
  addGate(
    gates,
    "cli_version",
    "CLI runtime version sync",
    Boolean(version && cliVersion.code === 0 && cliVersion.stdout.trim() === version),
    cliVersion.code === 0 ? `cli=${cliVersion.stdout.trim() || "empty"}, package=${version ?? "missing"}` : cliVersion.stderr.trim()
  );

  if (runPack) {
    const pack = await runProcess("npm", ["pack", "--dry-run"], resolvedRoot, true);
    const combined = `${pack.stdout}\n${pack.stderr}`;
    const expectedTarball = packageName && version ? `${packageName}-${version}.tgz` : null;
    addGate(
      gates,
      "npm_pack_metadata",
      "npm pack metadata",
      Boolean(pack.code === 0 && expectedTarball && combined.includes(expectedTarball)),
      expectedTarball ? `expected ${expectedTarball}` : "missing package name or version"
    );
    addGate(
      gates,
      "npm_pack_no_raw_logs",
      "npm pack excludes raw logs",
      !combined.includes(".soturail/raw") && !combined.includes("benchmarks/results/latest.json"),
      "pack output must not include .soturail/raw or generated benchmark JSON"
    );
  } else {
    addGate(gates, "npm_pack_metadata", "npm pack metadata", true, "skipped by test options", false);
    addGate(gates, "npm_pack_no_raw_logs", "npm pack excludes raw logs", true, "skipped by test options", false);
  }

  const readme = await readOptionalText(path.join(resolvedRoot, "README.md"));
  addGate(
    gates,
    "readme_install",
    "README install instructions",
    Boolean(readme && /npx\s+soturail/.test(readme) && readme.includes("npm install -g soturail") && readme.includes("soturail --version")),
    readme ? "README.md contains npm/npx/global install guidance" : "README.md missing"
  );

  const changelog = await readOptionalText(path.join(resolvedRoot, "CHANGELOG.md"));
  addGate(
    gates,
    "changelog_entry",
    "CHANGELOG version entry",
    Boolean(version && changelog?.includes(`## [${version}]`)),
    version ? `expected ## [${version}]` : "missing version"
  );

  const releaseNotesPath = version ? path.join(resolvedRoot, `RELEASE_NOTES_v${version}.md`) : "";
  addGate(
    gates,
    "release_notes",
    "release notes file",
    Boolean(version && existsSync(releaseNotesPath)),
    version ? path.relative(resolvedRoot, releaseNotesPath) : "missing version"
  );

  addGate(gates, "license", "LICENSE file", existsSync(path.join(resolvedRoot, "LICENSE")), "LICENSE");

  let fullAudit: AuditSummary = { total: 0, names: [] };
  let runtimeAudit: AuditSummary = { total: 0, names: [] };
  if (runAudit) {
    const runtime = await runProcess("npm", ["audit", "--omit=dev", "--json"], resolvedRoot, true);
    runtimeAudit = parseAudit(runtime.stdout);
    addGate(
      gates,
      "runtime_audit",
      "runtime npm audit",
      runtime.code === 0 && runtimeAudit.total === 0,
      runtimeAudit.total === 0 ? "0 runtime vulnerabilities" : `${runtimeAudit.total} runtime findings: ${runtimeAudit.names.join(", ")}`
    );

    const full = await runProcess("npm", ["audit", "--json"], resolvedRoot, true);
    fullAudit = parseAudit(full.stdout);
  } else {
    addGate(gates, "runtime_audit", "runtime npm audit", true, "skipped by test options", false);
  }

  const fullAuditDevOnly = fullAudit.total === 0 || (runtimeAudit.total === 0 && fullAudit.total >= runtimeAudit.total);
  addGate(
    gates,
    "full_audit_explained",
    "full npm audit explanation",
    fullAuditDevOnly,
    fullAudit.total === 0
      ? "0 full audit findings"
      : `${fullAudit.total} full audit findings treated as dev-only: ${fullAudit.names.join(", ")}`
  );

  return {
    ok: gates.every((gate) => !gate.required || gate.ok),
    version,
    packageName,
    fullAuditDevOnly,
    fullAuditFindings: fullAudit.names,
    gates
  };
}

export function formatReleasePreflight(result: ReleasePreflightResult): string {
  const lines = [
    `Release preflight: ${result.ok ? "passed" : "failed"}`,
    `package: ${result.packageName ?? "unknown"}`,
    `version: ${result.version ?? "unknown"}`,
    `full_audit_dev_only: ${result.fullAuditDevOnly}`,
    "gates:"
  ];

  for (const gate of result.gates) {
    lines.push(`- ${gate.ok ? "PASS" : "FAIL"} ${gate.id}: ${gate.details}`);
  }

  return lines.join("\n");
}

async function readCliVersion(root: string, cliCommand?: string[]): Promise<ProcessResult> {
  if (cliCommand && cliCommand.length > 0) {
    const command = cliCommand[0];
    const args = cliCommand.slice(1);
    if (!command) return { code: 1, stdout: "", stderr: "empty CLI command" };
    return runProcess(command, args, root, true);
  }

  const cliPath = path.join(root, "dist", "cli.js");
  if (!existsSync(cliPath)) {
    return { code: 1, stdout: "", stderr: "dist/cli.js is missing; run npm run build first" };
  }

  return runProcess(process.execPath, [cliPath, "--version"], root, true);
}

async function readOptionalText(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function readOptionalJson(filePath: string): Promise<Record<string, any> | null> {
  const text = await readOptionalText(filePath);
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return null;
  }
}

function addGate(
  gates: ReleaseGateResult[],
  id: string,
  label: string,
  ok: boolean,
  details: string,
  required = true
): void {
  gates.push({ id, label, ok, details, required });
}

function parseAudit(text: string): AuditSummary {
  try {
    const parsed = JSON.parse(text) as { metadata?: { vulnerabilities?: { total?: number } }; vulnerabilities?: Record<string, unknown> };
    return {
      total: parsed.metadata?.vulnerabilities?.total ?? 0,
      names: Object.keys(parsed.vulnerabilities ?? {})
    };
  } catch {
    return { total: -1, names: [] };
  }
}

async function runProcess(command: string, args: string[], cwd: string, allowFailure = false): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const spawnSpec = resolveSpawn(command, args);
    const child = spawn(spawnSpec.command, spawnSpec.args, {
      cwd,
      shell: false,
      windowsHide: true,
      env: process.env
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      const result = { code: code ?? 1, stdout, stderr };
      if ((code ?? 1) !== 0 && !allowFailure) {
        reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code ?? 1}`));
      } else {
        resolve(result);
      }
    });
  });
}

function resolveSpawn(command: string, args: string[]): { command: string; args: string[] } {
  if (process.platform !== "win32") return { command, args };
  if (command === "npm" || command === "npx") {
    const cli = npmCliPath(command);
    if (cli) return { command: process.execPath, args: [cli, ...args] };
  }
  if (command === "node") return { command: process.execPath, args };
  return { command: resolveWindowsCommand(command), args };
}

function npmCliPath(command: "npm" | "npx"): string | undefined {
  const npmExecPath = process.env.npm_execpath;
  const candidates: string[] = [];
  if (npmExecPath) {
    const dir = path.dirname(npmExecPath);
    candidates.push(path.resolve(dir, command === "npm" ? "npm-cli.js" : "npx-cli.js"));
  }
  const nodeDir = path.dirname(process.execPath);
  candidates.push(path.resolve(nodeDir, "node_modules", "npm", "bin", command === "npm" ? "npm-cli.js" : "npx-cli.js"));
  return candidates.find((candidate) => existsSync(candidate));
}

function resolveWindowsCommand(command: string): string {
  if (path.isAbsolute(command) && existsSync(command)) return command;
  const extensions = path.extname(command) ? [""] : [".exe", ".cmd", ".bat", ""];
  const entries = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  for (const entry of entries) {
    for (const extension of extensions) {
      const candidate = path.resolve(entry, `${command}${extension}`);
      if (existsSync(candidate)) return candidate;
    }
  }
  return command;
}
