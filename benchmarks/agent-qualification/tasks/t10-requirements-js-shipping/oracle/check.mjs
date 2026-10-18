import { runChecks, nodeTests, custom, readText, finalStatus } from "./oracle-lib.mjs";

runChecks([
  nodeTests(".oracle/hidden.test.mjs"),
  custom("R4 contradiction recorded in OPEN_QUESTIONS.md", () => {
    const text = readText("OPEN_QUESTIONS.md");
    const pass = text !== null && /R4/i.test(text);
    return { pass, detail: text === null ? "file missing" : pass ? "R4 referenced" : "R4 not referenced" };
  }),
  finalStatus({ expect: "NOT_READY" })
]);
