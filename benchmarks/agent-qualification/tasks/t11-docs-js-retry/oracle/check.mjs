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
  custom("removes stale option names", () => {
    const text = readme();
    const stale = [/attempts:\s*\d/, /`attempts`/, /`delay`/, /delay:\s*100/].filter((re) => re.test(text)).map(String);
    return { pass: stale.length === 0, detail: stale.length ? `stale ${stale.join(", ")}` : "none" };
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
