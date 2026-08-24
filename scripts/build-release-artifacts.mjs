#!/usr/bin/env node
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = process.cwd();
const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
const legacyReleaseDir = path.join(root, "dist", "release");
const releaseDir = path.join(root, "release-artifacts", `v${packageJson.version}`);
await fs.rm(legacyReleaseDir, { recursive: true, force: true });
await fs.rm(releaseDir, { recursive: true, force: true });
await fs.mkdir(releaseDir, { recursive: true });

const npmCommand = process.platform === "win32" && process.env.npm_execpath
  ? { command: process.execPath, prefix: [process.env.npm_execpath] }
  : { command: process.platform === "win32" ? "npm.cmd" : "npm", prefix: [] };
const { stdout: packOutput } = await exec(npmCommand.command, [...npmCommand.prefix, "pack", "--json", "--pack-destination", releaseDir], { cwd: root, windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
const packed = JSON.parse(packOutput);
const tarballName = packed[0]?.filename;
if (!tarballName) throw new Error("npm pack did not report a tarball filename.");
const tarballPath = path.join(releaseDir, tarballName);

const sbomPath = path.join(releaseDir, "sbom.cdx.json");
await atomicWrite(sbomPath, `${JSON.stringify(await createSbom(), null, 2)}\n`);

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

async function createSbom() {
  const packageLock = JSON.parse(await fs.readFile(path.join(root, "package-lock.json"), "utf8"));
  const components = Object.entries(packageLock.packages ?? {})
    .filter(([location, metadata]) => location.startsWith("node_modules/") && metadata?.dev !== true && metadata?.version)
    .map(([location, metadata]) => {
      const name = metadata.name ?? location.slice(location.lastIndexOf("node_modules/") + "node_modules/".length);
      const purl = npmPurl(name, metadata.version);
      return {
        type: "library",
        "bom-ref": purl,
        name,
        version: metadata.version,
        purl,
        ...(metadata.license ? { licenses: [{ license: { name: metadata.license } }] } : {}),
        ...(metadata.resolved ? { externalReferences: [{ type: "distribution", url: metadata.resolved }] } : {})
      };
    })
    .sort((left, right) => left["bom-ref"].localeCompare(right["bom-ref"]));
  const rootRef = npmPurl(packageJson.name, packageJson.version);
  const directRefs = Object.keys(packageJson.dependencies ?? {})
    .map((name) => components.find((component) => component.name === name)?.["bom-ref"])
    .filter(Boolean)
    .sort();
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    serialNumber: `urn:uuid:${randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: { components: [{ type: "application", name: "soturail-release-artifacts", version: packageJson.version }] },
      component: { type: "application", "bom-ref": rootRef, name: packageJson.name, version: packageJson.version, purl: rootRef }
    },
    components,
    dependencies: [{ ref: rootRef, dependsOn: directRefs }]
  };
}

function npmPurl(name, version) {
  const encodedName = name.startsWith("@")
    ? `${encodeURIComponent(name.slice(0, name.indexOf("/")))}/${encodeURIComponent(name.slice(name.indexOf("/") + 1))}`
    : encodeURIComponent(name);
  return `pkg:npm/${encodedName}@${encodeURIComponent(version)}`;
}
