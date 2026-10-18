#!/usr/bin/env node
// Re-scores finished runs with the current oracle when an oracle defect is fixed.
// Needs the run workspaces (OS temp dir, aq-runs/<run-id>/...). The previous oracle
// result is kept in record.oracleHistory so every change of verdict stays auditable.
//   node harness/rescore.mjs <run-id> [task-prefix,...]
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { SUITE_DIR, evaluate, loadTasks, oracleDigest, scoreRun } from "./lib.mjs";

const [runId, filter = "all"] = process.argv.slice(2);
if (!runId) throw new Error("usage: rescore.mjs <run-id> [task-prefix,...]");
const tasks = loadTasks(filter);
const resultsDir = path.join(SUITE_DIR, "results", runId);
let changed = 0;

for (const entry of readdirSync(resultsDir)) {
  const recordFile = path.join(resultsDir, entry, "record.json");
  if (!existsSync(recordFile)) continue;
  const record = JSON.parse(readFileSync(recordFile, "utf8"));
  const task = tasks.find((item) => item.id === record.task);
  if (!task) continue;
  const workDir = path.join(os.tmpdir(), "aq-runs", runId, entry);
  if (!existsSync(workDir)) {
    process.stdout.write(`skip ${entry}: workspace no longer exists\n`);
    continue;
  }
  const digest = oracleDigest(task);
  if (record.oracleDigest === digest) continue;
  const finalMessage = readFileSync(path.join(resultsDir, entry, "final.md"), "utf8");
  const oracle = evaluate(task, workDir, finalMessage);
  const metrics = { ...record.metrics, finalMessage };
  const score = scoreRun({ task, oracle, metrics, visibleBefore: { pass: record.visibleBefore }, visibleAfter: { pass: record.visibleAfter } });
  record.oracleHistory = [...(record.oracleHistory ?? []), { oracleDigest: record.oracleDigest ?? null, pass: record.oracle.pass, failed: record.oracle.checks.filter((c) => !c.pass).map((c) => c.name), replacedAt: new Date().toISOString() }];
  if (record.oracle.pass !== oracle.pass) changed += 1;
  process.stdout.write(`${entry}: ${record.oracle.pass ? "pass" : "fail"} -> ${oracle.pass ? "pass" : "fail"}\n`);
  Object.assign(record, { oracle, score, oracleDigest: digest });
  writeFileSync(recordFile, `${JSON.stringify(record, null, 2)}\n`);
}
process.stdout.write(`${changed} verdict(s) changed\n`);
