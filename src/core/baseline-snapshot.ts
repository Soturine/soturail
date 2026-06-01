import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { getWorkspacePaths, relativeToRoot, writeJson } from "./config.js";
import { SOTURAIL_VERSION } from "./version.js";

const execFileAsync = promisify(execFile);

export type BaselineMode = "check" | "zip" | "bundle" | "pack";

export interface BaselineSignal {
  id: string;
  ok: boolean;
  details: string;
  required: boolean;
}

export interface BaselineReport {
  schemaVersion: "soturail.baseline.v1";
  createdAt: string;
  version: string;
  gitCommit: string;
  dirtyStatus: string;
  githubFolderStatus: string;
  nodeModulesStatus: string;
  releaseNotesPath: string;
  mode: BaselineMode;
  signals: BaselineSignal[];
  recommendedArtifacts: string[];
  commandsUsedOrRecommended: string[];
  artifacts: string[];
  warnings: string[];
  nextCommands: string[];
}

export async function baselineSnapshot(root = process.cwd(), mode: BaselineMode): Promise<{ report: BaselineReport; output: string }> {
  const resolvedRoot = path.resolve(root);
  const packageJson = await readJson(path.join(resolvedRoot, "package.json"));
  const version = typeof packageJson.version === "string" ? packageJson.version : SOTURAIL_VERSION;
  const dir = path.join(getWorkspacePaths(resolvedRoot).workspace, "baselines");
  await fs.mkdir(dir, { recursive: true });
  const status = await run("git", ["status", "--short"], resolvedRoot, true);
  const commit = await run("git", ["rev-parse", "--short", "HEAD"], resolvedRoot, true);
  const releaseNotes = path.join("docs", "releases", `RELEASE_NOTES_v${version}.md`);
  const signals = await baselineSignals(resolvedRoot, version);
  const commands: string[] = [];
  const artifacts: string[] = [];
  const warnings = [
    "Do not manually zip the whole working directory.",
    "Use git archive for source zip.",
    "Use git bundle for history backup.",
    "Use npm pack for npm package snapshot."
  ];

  if (mode === "zip") {
    const output = path.join(dir, `soturail-v${version}-source.zip`);
    const command = `git archive --format=zip --output ${relativeToRoot(resolvedRoot, output)} HEAD`;
    commands.push(command);
    const result = await run("git", ["archive", "--format=zip", "--output", output, "HEAD"], resolvedRoot, true);
    if (result.code === 0) artifacts.push(output);
    else warnings.push(`git archive was not executed successfully; recommended command: ${command}`);
  }

  if (mode === "bundle") {
    const output = path.join(dir, `soturail-v${version}.bundle`);
    const command = `git bundle create ${relativeToRoot(resolvedRoot, output)} --all`;
    commands.push(command);
    const result = await run("git", ["bundle", "create", output, "--all"], resolvedRoot, true);
    if (result.code === 0) artifacts.push(output);
    else warnings.push(`git bundle was not executed successfully; recommended command: ${command}`);
  }

  if (mode === "pack") {
    const command = `npm pack --pack-destination ${relativeToRoot(resolvedRoot, dir)}`;
    commands.push(command);
    const result = await run("npm", ["pack", "--pack-destination", dir], resolvedRoot, true);
    const tarball = extractTarballName(`${result.stdout}\n${result.stderr}`);
    if (result.code === 0 && tarball) artifacts.push(path.join(dir, path.basename(tarball)));
    else warnings.push(`npm pack was not executed successfully; recommended command: ${command}`);
  }

  if (mode === "check") {
    commands.push(
      `git archive --format=zip --output .soturail/baselines/soturail-v${version}-source.zip HEAD`,
      `git bundle create .soturail/baselines/soturail-v${version}.bundle --all`,
      `npm pack --pack-destination .soturail/baselines`
    );
  }

  const dirtyStatus = status.stdout.trim() ? "dirty" : "clean";
  if (dirtyStatus === "dirty") {
    warnings.push("Working tree is dirty; make a clean commit before final release snapshots.");
  }
  for (const failed of signals.filter((signal) => !signal.ok && signal.required)) {
    warnings.push(baselineSignalGuidance(failed));
  }

  const report: BaselineReport = {
    schemaVersion: "soturail.baseline.v1",
    createdAt: new Date().toISOString(),
    version,
    gitCommit: commit.stdout.trim() || "unknown",
    dirtyStatus,
    githubFolderStatus: existsSync(path.join(resolvedRoot, ".github")) ? "present" : "missing",
    nodeModulesStatus: existsSync(path.join(resolvedRoot, "node_modules")) ? "present-not-for-source-snapshot" : "not present",
    releaseNotesPath: releaseNotes,
    mode,
    signals,
    recommendedArtifacts: [
      `.soturail/baselines/soturail-v${version}-source.zip`,
      `.soturail/baselines/soturail-v${version}.bundle`,
      `soturail-${version}.tgz`
    ],
    commandsUsedOrRecommended: commands,
    artifacts: artifacts.map((artifact) => relativeToRoot(resolvedRoot, artifact)),
    warnings,
    nextCommands: [
      "soturail self baseline --check",
      "soturail self baseline --zip",
      "soturail self baseline --bundle",
      "soturail self baseline --pack"
    ]
  };
  await writeBaselineReports(resolvedRoot, report);
  return { report, output: renderBaselineOutput(resolvedRoot, report) };
}

async function baselineSignals(root: string, version: string): Promise<BaselineSignal[]> {
  const changelog = await readText(path.join(root, "CHANGELOG.md"));
  const readme = await readText(path.join(root, "README.md"));
  const versionTs = await readText(path.join(root, "src", "core", "version.ts"));
  const releaseNotes = path.join(root, "docs", "releases", `RELEASE_NOTES_v${version}.md`);
  const pack = await run("npm", ["pack", "--dry-run", "--json"], root, true);
  const packText = `${pack.stdout}\n${pack.stderr}`;
  return [
    signal("git_dir", existsSync(path.join(root, ".git")), ".git exists"),
    signal("github_dir", existsSync(path.join(root, ".github")), ".github exists; create it before release if missing"),
    signal("github_ci", existsSync(path.join(root, ".github", "workflows", "ci.yml")), ".github/workflows/ci.yml exists; CI evidence belongs in source snapshots"),
    signal("node_modules_source_snapshot", true, existsSync(path.join(root, "node_modules")) ? "node_modules present; exclude from source snapshots" : "node_modules not present"),
    signal("docs_releases", existsSync(path.join(root, "docs", "releases")), "docs/releases exists"),
    signal("readme", readme.length > 0, "README.md exists"),
    signal("version_sync", versionTs.includes(`"${version}"`) || SOTURAIL_VERSION === version, `package=${version}, cli=${SOTURAIL_VERSION}; package and CLI versions must match`),
    signal("changelog_entry", changelog.includes(`## [${version}]`), `expected CHANGELOG entry ## [${version}]`),
    signal("release_notes", existsSync(releaseNotes), `${path.join("docs", "releases", `RELEASE_NOTES_v${version}.md`)} must exist before release`),
    signal("npm_pack_metadata", pack.code === 0 && packText.includes("README.md") && packText.includes("package.json"), "npm pack dry-run includes README.md and package.json"),
    signal("npm_pack_readme_docs_dist", pack.code === 0 && packText.includes("README.md") && packText.includes("docs/") && packText.includes("dist/"), "npm pack dry-run should include README.md, docs/ and dist/")
  ];
}

async function writeBaselineReports(root: string, report: BaselineReport): Promise<void> {
  const dir = path.join(getWorkspacePaths(root).workspace, "baselines");
  await fs.mkdir(dir, { recursive: true });
  await writeJson(path.join(dir, "latest.json"), report);
  await fs.writeFile(path.join(dir, "latest.md"), renderBaselineMarkdown(report), "utf8");
}

function renderBaselineOutput(root: string, report: BaselineReport): string {
  return [
    "SotuRail self baseline",
    `mode: ${report.mode}`,
    `version: ${report.version}`,
    `git_commit: ${report.gitCommit}`,
    `dirty_status: ${report.dirtyStatus}`,
    `release_notes_path: ${report.releaseNotesPath}`,
    `signals_passed: ${report.signals.filter((item) => item.ok).length}`,
    `signals_failed: ${report.signals.filter((item) => !item.ok && item.required).length}`,
    `artifacts: ${report.artifacts.length === 0 ? "none" : report.artifacts.join(", ")}`,
    `json: ${relativeToRoot(root, path.join(getWorkspacePaths(root).workspace, "baselines", "latest.json"))}`,
    `markdown: ${relativeToRoot(root, path.join(getWorkspacePaths(root).workspace, "baselines", "latest.md"))}`,
    "",
    "Warnings:",
    ...report.warnings.map((warning) => `- ${warning}`),
    "",
    "Commands:",
    ...report.commandsUsedOrRecommended.map((command) => `- ${command}`)
  ].join("\n") + "\n";
}

function renderBaselineMarkdown(report: BaselineReport): string {
  return [
    "# SotuRail Baseline Snapshot Report",
    "",
    `schemaVersion: ${report.schemaVersion}`,
    `createdAt: ${report.createdAt}`,
    `mode: ${report.mode}`,
    `version: ${report.version}`,
    `gitCommit: ${report.gitCommit}`,
    `dirtyStatus: ${report.dirtyStatus}`,
    `githubFolderStatus: ${report.githubFolderStatus}`,
    `nodeModulesStatus: ${report.nodeModulesStatus}`,
    `releaseNotesPath: ${report.releaseNotesPath}`,
    "",
    "## Signals",
    "",
    ...report.signals.map((item) => `- ${item.ok ? "PASS" : item.required ? "FAIL" : "WARN"} ${item.id}: ${item.details}`),
    "",
    "## Recommended Artifacts",
    "",
    ...report.recommendedArtifacts.map((artifact) => `- ${artifact}`),
    "",
    "## Commands",
    "",
    ...report.commandsUsedOrRecommended.map((command) => `- ${command}`),
    "",
    "## Artifacts",
    "",
    ...(report.artifacts.length > 0 ? report.artifacts.map((artifact) => `- ${artifact}`) : ["- none"]),
    "",
    "## Warnings",
    "",
    ...report.warnings.map((warning) => `- ${warning}`),
    ""
  ].join("\n");
}

function signal(id: string, ok: boolean, details: string, required = true): BaselineSignal {
  return { id, ok, details, required };
}

function baselineSignalGuidance(signal: BaselineSignal): string {
  const guidance: Record<string, string> = {
    github_dir: ".github is missing; add repository metadata before source snapshots.",
    github_ci: ".github/workflows/ci.yml is missing; release evidence may lack CI coverage.",
    release_notes: "Release notes are missing under docs/releases; create RELEASE_NOTES_v<version>.md.",
    version_sync: "Package and CLI versions do not match; run npm run sync:version after updating package.json.",
    npm_pack_metadata: "npm pack dry-run is missing README.md/package.json metadata.",
    npm_pack_readme_docs_dist: "npm pack dry-run should include README.md, docs/ and dist/ for a usable package snapshot."
  };
  return guidance[signal.id] ?? `${signal.id} failed: ${signal.details}`;
}

async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8").catch(() => "");
}

async function readJson(filePath: string): Promise<Record<string, unknown>> {
  const raw = await readText(filePath);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function run(command: string, args: string[], cwd: string, allowFailure = false): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const executable = resolveWindowsCommand(command);
    const runner = windowsScriptRunner(executable, args);
    const result = await execFileAsync(runner.command, runner.args, { cwd, windowsHide: true, timeout: 30000, maxBuffer: 16 * 1024 * 1024 });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const maybe = error as { code?: number; stdout?: string; stderr?: string; message?: string };
    if (allowFailure) {
      return { code: typeof maybe.code === "number" ? maybe.code : 1, stdout: maybe.stdout ?? "", stderr: maybe.stderr ?? maybe.message ?? "" };
    }
    throw error;
  }
}

function extractTarballName(text: string): string | undefined {
  const filename = /"filename"\s*:\s*"([^"]+\.tgz)"/.exec(text)?.[1];
  if (filename) return filename;
  return text.split(/\r?\n/).map((line) => line.trim()).find((line) => line.endsWith(".tgz"));
}

function windowsScriptRunner(command: string, args: string[]): { command: string; args: string[] } {
  if (process.platform !== "win32" || !/\.(cmd|bat)$/i.test(command)) return { command, args };
  const comspec = process.env.ComSpec ?? "cmd.exe";
  return { command: comspec, args: ["/d", "/c", "call", command, ...args] };
}

function resolveWindowsCommand(command: string): string {
  if (process.platform !== "win32") return command;
  if (command === "node") return process.execPath;
  const extensions = path.extname(command) ? [""] : [".cmd", ".exe", ".bat", ""];
  for (const entry of (process.env.PATH ?? "").split(path.delimiter).filter(Boolean)) {
    for (const extension of extensions) {
      const candidate = path.resolve(entry, `${command}${extension}`);
      if (existsSync(candidate)) return candidate;
    }
  }
  return command;
}
