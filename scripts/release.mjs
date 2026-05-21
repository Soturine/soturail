#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const versionArg = readArg("--version");
const otpArg = readArg("--otp");
const mode = process.argv[2] ?? "check";
const generatedFiles = [
  path.resolve(root, "benchmarks", "reports", "latest.md"),
  path.resolve(root, "benchmarks", "results", "latest.json")
];

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function assertVersion(value) {
  if (!value || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value)) {
    throw new Error(`Expected ${value ? "valid " : ""}--version X.Y.Z`);
  }
}

async function run(command, args = [], options = {}) {
  const label = `${command} ${args.join(" ")}`.trim();
  console.log(`\n$ ${label}`);
  return new Promise((resolve, reject) => {
    const spawnSpec = resolveSpawn(command, args);
    const child = spawn(spawnSpec.command, spawnSpec.args, {
      cwd: root,
      shell: false,
      windowsHide: true,
      env: process.env
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (!options.quiet) process.stdout.write(text);
    });
    child.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (!options.quiet) process.stderr.write(text);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      const result = { command: label, code: code ?? 1, stdout, stderr };
      if ((code ?? 1) !== 0 && !options.allowFailure) {
        reject(new Error(`${label} failed with exit code ${code ?? 1}`));
      } else {
        resolve(result);
      }
    });
  });
}

function resolveSpawn(command, args) {
  if (process.platform !== "win32") return { command, args };
  if (command === "npm" || command === "npx") {
    const cli = npmCliPath(command);
    if (cli) return { command: process.execPath, args: [cli, ...args] };
  }
  return { command: resolveWindowsCommand(command), args };
}

function npmCliPath(command) {
  const npmExecPath = process.env.npm_execpath;
  const candidates = [];
  if (npmExecPath) {
    const dir = path.dirname(npmExecPath);
    candidates.push(path.resolve(dir, command === "npm" ? "npm-cli.js" : "npx-cli.js"));
  }
  const nodeDir = path.dirname(process.execPath);
  candidates.push(path.resolve(nodeDir, "node_modules", "npm", "bin", command === "npm" ? "npm-cli.js" : "npx-cli.js"));
  return candidates.find((candidate) => existsSync(candidate));
}

function resolveWindowsCommand(command) {
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

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(path.resolve(root, filePath), "utf8"));
}

async function getLocalVersion() {
  return (await readJson("package.json")).version;
}

async function getPublishedVersion() {
  const result = await run("npm", ["view", "soturail", "version"], { quiet: true, allowFailure: true });
  return result.code === 0 ? result.stdout.trim() : "not published";
}

async function npmVersionExists(version) {
  const result = await run("npm", ["view", `soturail@${version}`, "version"], { quiet: true, allowFailure: true });
  return result.code === 0 && result.stdout.trim() === version;
}

async function gitStatusShort() {
  const status = await run("git", ["status", "--short"], { quiet: true });
  return status.stdout.trim();
}

async function parseAudit(args) {
  const result = await run("npm", ["audit", ...args, "--json"], { quiet: true, allowFailure: true });
  try {
    const parsed = JSON.parse(result.stdout);
    return {
      code: result.code,
      parsed,
      total: parsed.metadata?.vulnerabilities?.total ?? 0,
      moderate: parsed.metadata?.vulnerabilities?.moderate ?? 0,
      names: Object.keys(parsed.vulnerabilities ?? {})
    };
  } catch {
    return { code: result.code, parsed: null, total: -1, moderate: -1, names: [] };
  }
}

async function preserveGeneratedFiles(fn) {
  const snapshots = [];
  for (const filePath of generatedFiles) {
    if (existsSync(filePath)) {
      snapshots.push({ filePath, existed: true, content: await fs.readFile(filePath, "utf8") });
    } else {
      snapshots.push({ filePath, existed: false, content: "" });
    }
  }
  try {
    return await fn();
  } finally {
    for (const snapshot of snapshots) {
      if (snapshot.existed) {
        await fs.mkdir(path.dirname(snapshot.filePath), { recursive: true });
        await fs.writeFile(snapshot.filePath, snapshot.content, "utf8");
      } else if (existsSync(snapshot.filePath)) {
        await fs.rm(snapshot.filePath, { force: true });
      }
    }
  }
}

function summarize(command, result) {
  const text = `${result.stdout}\n${result.stderr}`;
  if (command === "build") return result.code === 0 ? "passed (`tsc -p tsconfig.json`)" : "failed";
  if (command === "test") {
    const match = text.match(/Tests\s+\S*\s*(\d+)\s+passed/i) ?? text.match(/(\d+)\s+passed/);
    return result.code === 0 ? `passed (${match?.[1] ?? "tests"} passed)` : "failed";
  }
  if (command === "audit") return result.code === 0 ? "passed (`found 0 vulnerabilities`)" : "failed";
  if (command === "self") {
    const report = text.match(/report:\s*(.+)/)?.[1]?.trim() ?? ".soturail/reports/self-dogfood.md";
    return result.code === 0 ? `passed (report: ${report})` : "failed";
  }
  if (command === "pack") {
    const tgz = text.match(/soturail-[\w.-]+\.tgz/)?.[0] ?? "dry-run tarball";
    return result.code === 0 ? `passed (${tgz})` : "failed";
  }
  return result.code === 0 ? "passed" : "failed";
}

async function runValidation() {
  const results = {};
  results.install = await run("npm", ["install"]);
  results.build = await run("npm", ["run", "build"]);
  results.test = await run("npm", ["test"]);
  results.audit = await run("npm", ["audit", "--omit=dev"]);
  results.self = await preserveGeneratedFiles(() => run("node", ["dist/cli.js", "self", "all"]));
  results.pack = await run("npm", ["pack", "--dry-run"]);
  results.preflight = await run("node", ["dist/cli.js", "release", "check"]);
  return {
    results,
    summary: {
      build: summarize("build", results.build),
      test: summarize("test", results.test),
      audit: summarize("audit", results.audit),
      self: summarize("self", results.self),
      pack: summarize("pack", results.pack),
      preflight: summarize("preflight", results.preflight)
    }
  };
}

async function updateVersion(version) {
  await run("npm", ["version", version, "--no-git-tag-version"]);
  await run("node", ["scripts/sync-version.mjs"]);
}

function changelogSection(version, date) {
  return `## [${version}] - ${date}

### Added

- Added \`soturail self\` namespace.
- Added \`soturail self all\`.
- Added self-dogfooding report generation at \`.soturail/reports/self-dogfood.md\`.
- Added cache-friendly self-report structure with stable project data before dynamic execution data.
- Added expanded benchmark categories.
- Added Windows usage documentation.
- Added Skill Rail and Workflow Rail planning documentation.

### Changed

- Improved release validation flow around build, tests, audit, benchmarks and self-dogfooding.
- Improved stats accounting for tiny terminal outputs.

### Fixed

- Stats now reports when compression is not effective for tiny command outputs because metadata overhead is larger than the raw output.

### Security

- Runtime package audit remains clean with \`npm audit --omit=dev\`.
- Documented how to evaluate development-only audit findings without using \`npm audit fix --force\` blindly.`;
}

async function updateChangelog(version) {
  const filePath = path.resolve(root, "CHANGELOG.md");
  let text = await fs.readFile(filePath, "utf8");
  if (text.includes(`## [${version}]`)) return;
  const date = new Date().toISOString().slice(0, 10);
  const nextSection = changelogSection(version, date);
  text = text.replace(/## \[Unreleased\][\s\S]*?(?=\n## \[0\.2\.1\])/, `## [Unreleased]\n\n- No unreleased changes yet.\n\n${nextSection}\n\n`);
  await fs.writeFile(filePath, text, "utf8");
}

function releaseNotes(version, validation, fullAudit, runtimeAudit) {
  return `# SotuRail v${version} - Self-Dogfooding & Reliability

SotuRail v${version} adds the first self-dogfooding workflow: the project can now validate itself using SotuRail commands before release.

## Install

- \`npx soturail@${version} --help\`
- \`npm install -g soturail\`
- \`soturail --help\`

## Highlights

- \`soturail self doctor\`
- \`soturail self index\`
- \`soturail self build\`
- \`soturail self test\`
- \`soturail self bench\`
- \`soturail self report\`
- \`soturail self all\`
- Cache-friendly self-dogfood report.
- Honest tiny-output stats accounting.
- Expanded benchmark categories.
- Windows documentation.

## Validation

- \`npm run build\`: ${validation.summary.build}
- \`npm test\`: ${validation.summary.test}
- \`npm audit --omit=dev\`: ${validation.summary.audit}
- \`node dist/cli.js self all\`: ${validation.summary.self}
- \`npm pack --dry-run\`: ${validation.summary.pack}

## Audit Notes

Runtime audit is clean with \`npm audit --omit=dev\`. Remaining audit findings, if any, are development dependency findings and should be upgraded safely without \`--force\`.

- Runtime audit findings: ${runtimeAudit.total}
- Full audit findings: ${fullAudit.total}
- Development-only findings: ${fullAudit.names.length > 0 ? fullAudit.names.join(", ") : "none"}

## Notes

SotuRail does not claim provider cache hits unless real provider metadata is imported.

## Links

- npm: https://www.npmjs.com/package/soturail
- GitHub: https://github.com/Soturine/soturail
`;
}

async function createReleaseNotes(version, validation) {
  const fullAudit = await parseAudit([]);
  const runtimeAudit = await parseAudit(["--omit=dev"]);
  const filePath = path.resolve(root, `RELEASE_NOTES_v${version}.md`);
  await fs.writeFile(filePath, releaseNotes(version, validation, fullAudit, runtimeAudit), "utf8");
  return filePath;
}

async function checkMode() {
  const initialStatus = await gitStatusShort();
  const local = await getLocalVersion();
  const published = await getPublishedVersion();
  const versionExists = await npmVersionExists(local);
  const fullAudit = await parseAudit([]);
  const runtimeAudit = await parseAudit(["--omit=dev"]);
  const validation = await runValidation();
  const finalStatus = await gitStatusShort();

  console.log("\nRelease check summary");
  console.log(`local_package_version: ${local}`);
  console.log(`npm_published_version: ${published}`);
  console.log(`local_version_publishable: ${!versionExists}`);
  console.log(`runtime_audit_clean: ${runtimeAudit.total === 0}`);
  console.log(`dev_audit_has_findings: ${fullAudit.total > runtimeAudit.total}`);
  console.log(`dev_audit_findings: ${fullAudit.names.join(", ") || "none"}`);
  console.log(`git_clean_before: ${initialStatus.length === 0}`);
  console.log(`git_clean_after: ${finalStatus.length === 0}`);
  console.log(`validation_build: ${validation.summary.build}`);
  console.log(`validation_test: ${validation.summary.test}`);
  console.log(`validation_pack: ${validation.summary.pack}`);
  console.log(`validation_preflight: ${validation.summary.preflight}`);
}

async function prepareMode(version) {
  assertVersion(version);
  await updateVersion(version);
  await updateChangelog(version);
  const validation = await runValidation();
  await createReleaseNotes(version, validation);
  await run("git", ["add", "package.json", "package-lock.json", "src/core/version.ts", "CHANGELOG.md", `RELEASE_NOTES_v${version}.md`]);
  const status = await gitStatusShort();
  if (status.length === 0) {
    console.log(`No release preparation changes to commit for v${version}.`);
  } else {
    await run("git", ["commit", "-m", `chore(release): prepare v${version}`]);
    await run("git", ["push", "origin", "main"]);
  }
  console.log(`Release prepare complete for v${version}. npm publish was not run.`);
}

async function publishMode(version, options = {}) {
  assertVersion(version);
  const local = await getLocalVersion();
  if (local !== version) {
    throw new Error(`package.json version is ${local}, expected ${version}`);
  }
  const exists = await npmVersionExists(version);
  if (exists) {
    if (options.skipIfExists) {
      console.log(`soturail@${version} is already published; skipping npm publish.`);
      return { skipped: true };
    }
    throw new Error(`soturail@${version} already exists on npm.`);
  }
  const status = await gitStatusShort();
  if (status.length > 0) {
    throw new Error(`git status is not clean:\n${status}`);
  }
  await runValidation();
  const publishArgs = ["publish"];
  if (otpArg) publishArgs.push(`--otp=${otpArg}`);
  await run("npm", publishArgs).catch((error) => {
    console.error("npm publish did not complete.");
    console.error("If npm requested 2FA/authentication, rerun with a fresh one-time password:");
    console.error(`PowerShell: $env:NPM_CONFIG_OTP="<code>"; npm run release:publish -- --version ${version}; Remove-Item Env:NPM_CONFIG_OTP`);
    console.error(`cmd.exe: set NPM_CONFIG_OTP=<code> && npm run release:publish -- --version ${version} && set NPM_CONFIG_OTP=`);
    console.error(`macOS/Linux: NPM_CONFIG_OTP=<code> npm run release:publish -- --version ${version}`);
    throw error;
  });
  const published = await getPublishedVersion();
  console.log(`npm_published_version: ${published}`);
  await run("npx", ["--yes", `soturail@${version}`, "--version"]);
  return { skipped: false };
}

async function createOrUpdateGitHubRelease(version) {
  const tag = `v${version}`;
  const notes = `RELEASE_NOTES_v${version}.md`;
  const title = await releaseTitleFromNotes(version, `SotuRail v${version}`);
  const ghStatus = await run("gh", ["auth", "status"], { quiet: true, allowFailure: true });
  if (ghStatus.code !== 0) {
    console.log(`GitHub CLI is unavailable or unauthenticated. Manual command: gh release create ${tag} --title "${title}" --notes-file ${notes}`);
    return null;
  }
  const view = await run("gh", ["release", "view", tag], { quiet: true, allowFailure: true });
  if (view.code === 0) {
    await run("gh", ["release", "edit", tag, "--notes-file", notes, "--title", title]);
  } else {
    await run("gh", ["release", "create", tag, "--title", title, "--notes-file", notes]);
  }
  const url = (await run("gh", ["release", "view", tag, "--json", "url", "--jq", ".url"], { quiet: true })).stdout.trim();
  console.log(`github_release_url: ${url}`);
  return url;
}

async function releaseTitleFromNotes(version, fallback) {
  const notesPath = path.resolve(root, `RELEASE_NOTES_v${version}.md`);
  if (!existsSync(notesPath)) return fallback;
  const firstLine = (await fs.readFile(notesPath, "utf8")).split(/\r?\n/)[0]?.trim();
  return firstLine?.startsWith("# ") ? firstLine.slice(2).trim() : fallback;
}

async function fullMode(version) {
  assertVersion(version);
  const exists = await npmVersionExists(version);
  if (!exists) {
    await prepareMode(version);
    await publishMode(version);
  } else {
    console.log(`soturail@${version} already exists on npm; skipping prepare and npm publish.`);
  }
  await createOrUpdateGitHubRelease(version);
}

async function main() {
  try {
    if (mode === "check") await checkMode();
    else if (mode === "prepare") await prepareMode(versionArg);
    else if (mode === "publish") await publishMode(versionArg);
    else if (mode === "full") await fullMode(versionArg);
    else throw new Error(`Unknown release mode: ${mode}`);
    console.log("\nRelease automation finished successfully.");
  } catch (error) {
    console.error(`\nRelease automation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

main();
