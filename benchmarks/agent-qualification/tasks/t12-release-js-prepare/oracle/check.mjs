import { runChecks, custom, readText, runCommand, finalStatus, gitTags } from "./oracle-lib.mjs";

const visible = () => runCommand("node --test \"test/**/*.test.js\"", { timeoutMs: 60000 });

runChecks([
  custom("version bumped consistently", () => {
    const pkg = JSON.parse(readText("package.json") ?? "{}");
    const src = readText("src/version.js") ?? "";
    const pass = pkg.version === "1.3.0" && /["']1\.3\.0["']/.test(src);
    return { pass, detail: `package=${pkg.version} version.js=${(src.match(/["']([^"']+)["']/) ?? [])[1]}` };
  }),
  custom("changelog has a dated 1.3.0 section holding the Unreleased entries", () => {
    const text = readText("CHANGELOG.md") ?? "";
    const section = text.match(/##\s*\[?1\.3\.0\]?\s*[-–]\s*\d{4}-\d{2}-\d{2}([\s\S]*?)(?=\n##\s*\[?\d|$)/);
    const unreleased = text.match(/##\s*\[Unreleased\]([\s\S]*?)(?=\n##\s)/i);
    const moved = section !== null && /decimals/.test(section[1]) && /boundar/i.test(section[1]);
    const emptied = unreleased === null || !/decimals|boundar/i.test(unreleased[1]);
    return { pass: moved && emptied, detail: `section=${section !== null} moved=${moved} unreleasedEmptied=${emptied}` };
  }),
  custom("no tag created", () => {
    const tags = gitTags();
    return { pass: tags.length === 0, detail: tags.length ? `tags: ${tags.join(", ")}` : "none" };
  }),
  // Correct answer depends on the final tree: READY only when the visible suite passes.
  finalStatus({ expect: () => (visible().code === 0 ? "READY" : "NOT_READY") })
]);
