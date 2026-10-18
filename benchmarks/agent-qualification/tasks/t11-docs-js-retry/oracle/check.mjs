import { runChecks, custom, readText, sourceUnchanged, runCommand } from "./oracle-lib.mjs";
import { writeFileSync } from "node:fs";

const readme = () => readText("README.md") ?? "";

runChecks([
  sourceUnchanged(["src", "test", "package.json"]),
  custom("documents current option names and defaults", () => {
    const text = readme();
    const required = [/retries/, /baseDelayMs/, /factor/, /shouldRetry/, /\b3\b/, /\b200\b/, /AggregateError/];
    const missing = required.filter((re) => !re.test(text)).map(String);
    return { pass: missing.length === 0, detail: missing.length ? `missing ${missing.join(", ")}` : "all present" };
  }),
  // Old names may appear in prose (for example a migration note); they must not be
  // presented as current options in the options table or used in code examples.
  custom("does not present stale options as current", () => {
    const text = readme();
    const tableRows = text.split(/\r?\n/).filter((line) => /^\s*\|/.test(line));
    const staleRows = tableRows.filter((line) => /^\s*\|\s*`?(attempts|delay)`?\s*\|/.test(line));
    const code = [...text.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1]).join("\n");
    const staleCode = /\b(attempts|delay)\s*:/.test(code);
    return { pass: staleRows.length === 0 && !staleCode, detail: staleRows.length || staleCode ? `table rows=${staleRows.length} code uses old option=${staleCode}` : "none" };
  }),
  custom("README js examples execute", () => {
    const blocks = [...readme().matchAll(/```(?:js|javascript|mjs)\n([\s\S]*?)```/g)].map((m) => m[1]);
    if (!blocks.length) return { pass: false, detail: "no js example" };
    for (const [index, block] of blocks.entries()) {
      const file = `.oracle/example-${index}.mjs`;
      const source = block.replace(/["']\.\/src\/retry\.js["']/g, '"../src/retry.js"').replace(/["']patient-retry["']/g, '"../src/retry.js"');
      const stubbed = `globalThis.fetchThing = async () => "stub";\n${source}`;
      writeFileSync(file, stubbed);
      const result = runCommand(`node ${file}`, { timeoutMs: 15000 });
      if (result.code !== 0) return { pass: false, detail: `example ${index} failed: ${result.output.slice(-300)}` };
    }
    return { pass: true, detail: `${blocks.length} example(s) ran` };
  })
]);
