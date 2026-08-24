#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";

const mode = process.argv[2] ?? "check";
const version = readArg("--version");
const otp = readArg("--otp");

if (!["check", "publish", "github", "full"].includes(mode)) {
  throw new Error("Use release mode check, publish, github or full. Version preparation is explicit and reviewable; this wrapper does not edit or commit files.");
}
if (mode !== "check" && (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))) {
  throw new Error("Expected --version X.Y.Z");
}

await run(process.execPath, ["dist/cli.js", "release", mode, ...(version ? [version] : []), ...(mode === "full" ? ["--publish-npm", "--github-release"] : []), ...(otp ? ["--otp", otp] : [])]);

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), shell: false, windowsHide: true, stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`${path.basename(command)} exited ${code ?? 1}`)));
  });
}
