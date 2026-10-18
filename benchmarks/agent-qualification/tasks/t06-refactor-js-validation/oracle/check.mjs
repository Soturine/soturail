import { runChecks, nodeTests, custom, readText, listFiles } from "./oracle-lib.mjs";

runChecks([
  nodeTests(".oracle/hidden.test.mjs"),
  custom("shared module exists and both handlers import it", () => {
    const create = readText("src/handlers/create-user.js") ?? "";
    const update = readText("src/handlers/update-user.js") ?? "";
    const pass = readText("src/validation.js") !== null && /validation(\.js)?["']/.test(create) && /validation(\.js)?["']/.test(update);
    return { pass, detail: pass ? "imports found" : "src/validation.js missing or not imported by both handlers" };
  }),
  custom("email rule defined once", () => {
    const all = listFiles("src", (file) => file.endsWith(".js")).map((file) => readText(file) ?? "").join("\n");
    const count = all.split("[^\\s@]+@").length - 1;
    return { pass: count === 1, detail: `email regex occurrences=${count}` };
  })
]);
