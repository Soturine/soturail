import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import type { Command } from "commander";
import { formatReleasePreflight, runReleasePreflight } from "../core/release-preflight.js";

export function registerReleaseCommand(program: Command): void {
  const release = program
    .command("release")
    .description("Run local release reliability checks and release-note helpers.");

  release
    .command("check")
    .description("Validate package, CLI, changelog, release notes, pack metadata and runtime audit.")
    .action(async () => {
      const packageJson = JSON.parse(await fs.readFile(path.resolve(process.cwd(), "package.json"), "utf8")) as { version?: string };
      if (!packageJson.version) throw new Error("package.json version is missing.");
      await runReleaseGate(packageJson.version);
      process.stdout.write("Release check passed.\n");
    });

  release
    .command("notes")
    .description("Create a release notes skeleton for a version.")
    .argument("[version]", "Release version, for example X.Y.Z")
    .option("--target-version <version>", "Release version, for example X.Y.Z")
    .option("--version <version>", "Release version, kept for backward-compatible npm scripts")
    .action(async (versionArg: string | undefined, options: ReleaseVersionOptions) => {
      const version = resolveReleaseVersion(versionArg, options);
      const filePath = await writeReleaseNotesSkeleton(version, process.cwd());
      process.stdout.write(`Release notes written: ${path.relative(process.cwd(), filePath)}\n`);
    });

  release
    .command("publish [version]")
    .description("Validate and publish the package to npm.")
    .option("--target-version <version>", "Release version")
    .option("--version <version>", "Release version, kept for backward-compatible npm scripts")
    .option("--otp <code>", "npm one-time password when required")
    .action(async (versionArg: string | undefined, options: ReleaseVersionOptions & { otp?: string }) => {
      const version = resolveReleaseVersion(versionArg, options);
      await runReleaseGate(version);
      await runChecked("npm", ["publish", "--access", "public", "--auth-type=web", ...(options.otp ? [`--otp=${options.otp}`] : [])]);
      await runChecked("npm", ["view", "soturail", "version"]);
      await runChecked("npx", ["--yes", "--package", `soturail@${version}`, "soturail", "--version"]);
    });

  release
    .command("github [version]")
    .description("Create or update the GitHub release after npm publish succeeds.")
    .option("--target-version <version>", "Release version")
    .option("--version <version>", "Release version, kept for backward-compatible npm scripts")
    .action(async (versionArg: string | undefined, options: ReleaseVersionOptions) => {
      await createOrUpdateGithubRelease(resolveReleaseVersion(versionArg, options));
    });

  release
    .command("full [version]")
    .description("Run release gates, optionally publish npm, then optionally create/update GitHub release.")
    .option("--target-version <version>", "Release version")
    .option("--version <version>", "Release version, kept for backward-compatible npm scripts")
    .option("--publish-npm", "Publish to npm after gates pass")
    .option("--github-release", "Create or update GitHub release after npm publish is verified")
    .option("--otp <code>", "npm one-time password when required")
    .action(async (versionArg: string | undefined, options: ReleaseVersionOptions & { publishNpm?: boolean; githubRelease?: boolean; otp?: string }) => {
      const version = resolveReleaseVersion(versionArg, options);
      await runReleaseGate(version);
      if (options.publishNpm) {
        await runChecked("npm", ["publish", "--access", "public", "--auth-type=web", ...(options.otp ? [`--otp=${options.otp}`] : [])]);
        await runChecked("npm", ["view", "soturail", "version"]);
        await runChecked("npx", ["--yes", "--package", `soturail@${version}`, "soturail", "--version"]);
      }
      if (options.githubRelease) {
        await createOrUpdateGithubRelease(version);
      }
    });
}

type ReleaseVersionOptions = {
  version?: string;
  targetVersion?: string;
};

function resolveReleaseVersion(versionArg: string | undefined, options: ReleaseVersionOptions): string {
  const version = versionArg ?? options.targetVersion ?? options.version;
  if (!version) {
    throw new Error("Release version is required. Use `soturail release publish 0.3.0` or `--target-version 0.3.0`.");
  }
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid version: ${version}`);
  }
  return version;
}

export async function writeReleaseNotesSkeleton(version: string, root = process.cwd()): Promise<string> {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid version: ${version}`);
  }
  const filePath = path.join(path.resolve(root), `RELEASE_NOTES_v${version}.md`);
  const contents = `# SotuRail v${version} - Release Notes

## Install

    npx soturail@${version} --help
    npm install -g soturail
    soturail --help

## Highlights

- Update this section before publishing.

## Validation

- \`npm run build\`
- \`npm test\`
- \`npm audit --omit=dev\`
- \`npm pack --dry-run\`
- \`node dist/cli.js --version\`

## Links

- npm: https://www.npmjs.com/package/soturail
- GitHub: https://github.com/Soturine/soturail
`;
  await fs.writeFile(filePath, contents, "utf8");
  return filePath;
}

async function runReleaseGate(version: string): Promise<void> {
  const packageJson = JSON.parse(await fs.readFile(path.resolve(process.cwd(), "package.json"), "utf8")) as { version?: string };
  if (packageJson.version !== version) throw new Error(`package.json version is ${packageJson.version}, expected ${version}.`);
  const status = await runCapture("git", ["status", "--short"]);
  if (status.stdout.trim()) throw new Error(`git working tree is dirty:\n${status.stdout}`);
  await runChecked("npm", ["run", "build"]);
  const preflight = await runReleasePreflight(process.cwd());
  process.stdout.write(`${formatReleasePreflight(preflight)}\n`);
  if (!preflight.ok) throw new Error("Release preflight failed.");
  await runChecked("npm", ["test"]);
  await runChecked("npm", ["audit", "--omit=dev"]);
  await preserveGeneratedFiles(() => runChecked("node", ["dist/cli.js", "self", "all"]));
  await runChecked("npm", ["pack", "--dry-run"]);
}

async function preserveGeneratedFiles(fn: () => Promise<void>): Promise<void> {
  const files = [
    path.resolve(process.cwd(), "benchmarks", "reports", "latest.md"),
    path.resolve(process.cwd(), "benchmarks", "results", "latest.json")
  ];
  const snapshots = await Promise.all(files.map(async (filePath) => ({
    filePath,
    exists: await fs.access(filePath).then(() => true).catch(() => false),
    content: await fs.readFile(filePath, "utf8").catch(() => "")
  })));
  try {
    await fn();
  } finally {
    for (const snapshot of snapshots) {
      if (snapshot.exists) {
        await fs.writeFile(snapshot.filePath, snapshot.content, "utf8");
      } else {
        await fs.rm(snapshot.filePath, { force: true });
      }
    }
  }
}

async function createOrUpdateGithubRelease(version: string): Promise<void> {
  const published = (await runCapture("npm", ["view", "soturail", "version"])).stdout.trim();
  if (published !== version) {
    throw new Error(`npm reports soturail@${published}; refusing to create GitHub release for ${version}.`);
  }
  const tag = `v${version}`;
  const title = version === "0.3.0"
    ? "SotuRail v0.3.0 - Skill Rail, MCP & Context Packs"
    : `SotuRail v${version}`;
  const notes = `RELEASE_NOTES_v${version}.md`;
  const view = await runCapture("gh", ["release", "view", tag], true);
  if (view.code === 0) {
    await runChecked("gh", ["release", "edit", tag, "--title", title, "--notes-file", notes, "--latest"]);
  } else {
    await runChecked("gh", ["release", "create", tag, "--title", title, "--notes-file", notes, "--latest"]);
  }
}

async function runChecked(command: string, args: string[]): Promise<void> {
  const result = await runCapture(command, args);
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.code !== 0) throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.code}`);
}

async function runCapture(command: string, args: string[], allowFailure = false): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const spawnSpec = resolveSpawn(command, args);
    const child = spawn(spawnSpec.command, spawnSpec.args, { cwd: process.cwd(), shell: false, windowsHide: true, env: process.env });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      const result = { code: code ?? 1, stdout, stderr };
      if (result.code !== 0 && !allowFailure) {
        resolve(result);
        return;
      }
      resolve(result);
    });
  });
}

function resolveSpawn(command: string, args: string[]): { command: string; args: string[] } {
  if (process.platform !== "win32") return { command, args };
  if (command === "node") return { command: process.execPath, args };
  const npmExecPath = process.env.npm_execpath;
  if ((command === "npm" || command === "npx") && npmExecPath) {
    const cli = path.resolve(path.dirname(npmExecPath), command === "npm" ? "npm-cli.js" : "npx-cli.js");
    return { command: process.execPath, args: [cli, ...args] };
  }
  return { command: resolveWindowsCommand(command), args };
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
