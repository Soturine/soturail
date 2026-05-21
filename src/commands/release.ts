import { promises as fs } from "node:fs";
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
      const result = await runReleasePreflight(process.cwd());
      process.stdout.write(`${formatReleasePreflight(result)}\n`);
      if (!result.ok) process.exitCode = 1;
    });

  release
    .command("notes")
    .description("Create a release notes skeleton for a version.")
    .requiredOption("--version <version>", "Release version, for example X.Y.Z")
    .action(async (options: { version: string }) => {
      const filePath = await writeReleaseNotesSkeleton(options.version, process.cwd());
      process.stdout.write(`Release notes written: ${path.relative(process.cwd(), filePath)}\n`);
    });
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
