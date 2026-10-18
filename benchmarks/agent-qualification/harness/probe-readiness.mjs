#!/usr/bin/env node
// Backfills SotuRail readiness classification for runs recorded before the probe existed.
// The probe runs `contract verify` with the run's own SotuRail version in the kept workspace,
// after the harness already ran visible tests and the oracle there, so it is labelled
// `post-hoc`; runs from run.mjs carry a `post-run` probe taken before the harness touched them.
//   node harness/probe-readiness.mjs <run-id>
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { SUITE_DIR, classifyReadiness, ensureSoturail, probeSoturailReadiness } from "./lib.mjs";

const [runId] = process.argv.slice(2);
if (!runId) throw new Error("usage: probe-readiness.mjs <run-id>");
const resultsDir = path.join(SUITE_DIR, "results", runId);
const run = JSON.parse(readFileSync(path.join(resultsDir, "run.json"), "utf8"));
const soturail = run.arms.some((arm) => arm !== "baseline") ? ensureSoturail(run.soturailVersion ?? "1.6.0") : null;
const counts = {};

for (const entry of readdirSync(resultsDir)) {
  const recordFile = path.join(resultsDir, entry, "record.json");
  if (!existsSync(recordFile)) continue;
  const record = JSON.parse(readFileSync(recordFile, "utf8"));
  if (record.readinessProbe?.when === "post-run") continue;
  const workDir = path.join(os.tmpdir(), "aq-runs", runId, entry);
  const contracts = record.arm !== "baseline" && existsSync(workDir) ? probeSoturailReadiness(workDir, soturail) : [];
  const finalMessage = readFileSync(path.join(resultsDir, entry, "final.md"), "utf8");
  const expected = record.oracle.checks.find((check) => check.kind === "claim")?.value?.expected ?? "READY";
  record.readinessProbe = { when: existsSync(workDir) ? "post-hoc" : "unavailable", contracts };
  record.readiness = classifyReadiness({ success: record.oracle.pass, expected, claims: record.score.claims, probe: contracts, finalMessage, checkAfterLastEdit: record.metrics.checkAfterLastEdit });
  writeFileSync(recordFile, `${JSON.stringify(record, null, 2)}\n`);
  const key = `${record.arm}:${record.readiness.outcome}`;
  counts[key] = (counts[key] ?? 0) + 1;
}
process.stdout.write(`${JSON.stringify(counts)}\n`);
