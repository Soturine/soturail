import { runChecks, custom, readText, sourceUnchanged, finalStatus } from "./oracle-lib.mjs";

const seeded = [
  { id: "bulk-threshold-off-by-one", file: "src/pricing.js", line: 7, slack: 3 },
  { id: "unawaited-save", file: "src/orders.js", line: 5, slack: 3 }
];

function findings() {
  try {
    const parsed = JSON.parse(readText("review.json") ?? "null");
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const norm = (file) => String(file ?? "").replace(/\\/g, "/").replace(/^\.\//, "");

runChecks([
  custom("review.json is a JSON array", () => {
    const list = findings();
    return { pass: list !== null, detail: list === null ? "missing or invalid" : `${list.length} findings` };
  }),
  ...seeded.map((defect) => custom(`finds ${defect.id}`, () => {
    const hit = (findings() ?? []).find((item) => norm(item.file).endsWith(defect.file) && Math.abs(Number(item.line) - defect.line) <= defect.slack);
    return { pass: Boolean(hit), detail: hit ? hit.summary : "not reported" };
  })),
  custom("false positives (informational)", () => {
    const list = findings() ?? [];
    const extra = list.filter((item) => !seeded.some((d) => norm(item.file).endsWith(d.file) && Math.abs(Number(item.line) - d.line) <= d.slack));
    return { pass: true, informational: true, detail: `${extra.length} unmatched finding(s)`, value: extra.length };
  }),
  sourceUnchanged(["src", "test", "docs", "package.json"]),
  finalStatus({ expect: "NOT_READY" })
]);
