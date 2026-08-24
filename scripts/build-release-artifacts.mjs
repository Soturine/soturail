#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = process.cwd();
const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
const releaseDir = path.join(root, "dist", "release", `v${packageJson.version}`);
await fs.mkdir(releaseDir, { recursive: true });

const npmCommand = process.platform === "win32" && process.env.npm_execpath
  ? { command: process.execPath, prefix: [process.env.npm_execpath] }
  : { command: process.platform === "win32" ? "npm.cmd" : "npm", prefix: [] };
const { stdout: packOutput } = await exec(npmCommand.command, [...npmCommand.prefix, "pack", "--json", "--pack-destination", releaseDir], { cwd: root, windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
const packed = JSON.parse(packOutput);
const tarballName = packed[0]?.filename;
if (!tarballName) throw new Error("npm pack did not report a tarball filename.");
const tarballPath = path.join(releaseDir, tarballName);

const cyclonedxCli = path.join(root, "node_modules", "@cyclonedx", "cyclonedx-npm", "bin", "cyclonedx-npm-cli.js");
const sbomPath = path.join(releaseDir, "sbom.cdx.json");
await exec(process.execPath, [cyclonedxCli, "--output-file", sbomPath, "--output-format", "JSON", "--spec-version", "1.6", "--omit", "dev"], { cwd: root, windowsHide: true, maxBuffer: 10 * 1024 * 1024 });

const files = [];
for (const filePath of [tarballPath, sbomPath]) {
  const content = await fs.readFile(filePath);
  files.push({ name: path.basename(filePath), bytes: content.length, sha256: createHash("sha256").update(content).digest("hex") });
}
const head = await exec("git", ["rev-parse", "HEAD"], { cwd: root, windowsHide: true }).then((result) => result.stdout.trim()).catch(() => "UNAVAILABLE");
const manifest = {
  schemaVersion: "soturail.release-artifacts.v1",
  version: packageJson.version,
  tag: `v${packageJson.version}`,
  commit: head,
  createdAt: new Date().toISOString(),
  files
};
await atomicWrite(path.join(releaseDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await atomicWrite(path.join(releaseDir, "SHA256SUMS.txt"), `${files.map((file) => `${file.sha256}  ${file.name}`).join("\n")}\n`);
process.stdout.write(`${JSON.stringify({ releaseDir: path.relative(root, releaseDir), ...manifest }, null, 2)}\n`);

async function atomicWrite(target, content) {
  const temp = `${target}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  const handle = await fs.open(temp, "wx", 0o600);
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(temp, target);
}
