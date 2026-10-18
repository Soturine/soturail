import { runChecks, nodeTests, fileMatches } from "./oracle-lib.mjs";
runChecks([
  nodeTests(".oracle/hidden.test.mjs"),
  fileMatches("README.md", [/overrides/, /remaining\(/], "README documents overrides and remaining()")
]);
