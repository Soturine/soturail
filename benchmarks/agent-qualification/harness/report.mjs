#!/usr/bin/env node
// Aggregates results/<run-id>/**/record.json into summary.json and report.md.
//   node harness/report.mjs <run-id> [<run-id> ...]
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SUITE_DIR, classifyReadiness } from "./lib.mjs";

const runIds = process.argv.slice(2);
if (!runIds.length) throw new Error("usage: report.mjs <run-id> [<run-id> ...]");

const records = [];
for (const runId of runIds) {
  const dir = path.join(SUITE_DIR, "results", runId);
  for (const entry of readdirSync(dir)) {
    const file = path.join(dir, entry, "record.json");
    if (existsSync(file)) records.push(JSON.parse(readFileSync(file, "utf8")));
  }
}

// Invalid runs (host quota/auth/crash) are excluded from every metric and counted separately.
const invalidRuns = records.filter((r) => r.invalid);
records.splice(0, records.length, ...records.filter((r) => !r.invalid));

const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
const rate = (items, pick) => (items.length ? items.filter(pick).length / items.length : null);
const pct = (value) => (value === null ? "–" : `${Math.round(value * 100)}%`);
const num = (value, digits = 0) => (value === null || value === undefined ? "–" : Number(value).toFixed(digits));
const totalTokens = (r) => r.metrics.tokens.input + r.metrics.tokens.output + r.metrics.tokens.cacheRead + r.metrics.tokens.cacheWrite;

// Records from before the readiness probe are classified from the final message only
// (basis "final-message-fallback"); run probe-readiness.mjs to classify them from verdict codes.
function readinessOf(r) {
  if (r.readiness) return r.readiness;
  const expected = r.oracle.checks.find((check) => check.kind === "claim")?.value?.expected ?? "READY";
  const finalMessage = readFileSync(path.join(SUITE_DIR, "results", r.runId, `${r.task}__${r.arm}__r${r.rep}`, "final.md"), "utf8");
  return classifyReadiness({ success: r.oracle.pass, expected, claims: r.score.claims, probe: [], finalMessage, checkAfterLastEdit: r.metrics.checkAfterLastEdit });
}

const OUTCOMES = ["correct-ready", "correct-not-ready", "review-pending", "false-ready", "false-not-ready", "no-claim"];

function aggregate(items) {
  const soturailArm = items.filter((r) => r.arm !== "baseline");
  return {
    runs: items.length,
    success: rate(items, (r) => r.score.success),
    regressions: rate(items, (r) => r.score.regression),
    falseVerified: rate(items, (r) => r.score.falseVerified),
    withContracts: items.filter((r) => readinessOf(r).soturailEvidence !== "none").length,
    evidenceCurrent: rate(items.filter((r) => readinessOf(r).soturailEvidence !== "none"), (r) => readinessOf(r).soturailEvidence === "current"),
    reviewPending: rate(items, (r) => readinessOf(r).reviewPending),
    undueBlock: rate(items, (r) => readinessOf(r).undueTechnicalBlock),
    outcomes: Object.fromEntries(OUTCOMES.map((o) => [o, items.filter((r) => readinessOf(r).outcome === o).length])),
    claimCorrect: rate(items, (r) => ["correct-ready", "correct-not-ready", "review-pending"].includes(readinessOf(r).outcome)),
    basis: items.reduce((acc, r) => ({ ...acc, [readinessOf(r).basis]: (acc[readinessOf(r).basis] ?? 0) + 1 }), {}),
    checkAfterLastEdit: rate(items, (r) => r.metrics.checkAfterLastEdit),
    usedSoturail: soturailArm.length ? rate(soturailArm, (r) => r.score.usedSoturail) : null,
    skillRecall: mean(soturailArm.map((r) => r.score.skillRecall).filter((v) => v !== null)),
    toolCalls: mean(items.map((r) => r.metrics.toolCalls)),
    duplicateCalls: mean(items.map((r) => r.metrics.duplicateCalls)),
    toolErrors: mean(items.map((r) => r.metrics.toolErrors)),
    recoveredErrors: mean(items.map((r) => r.metrics.recoveredErrors)),
    turns: mean(items.map((r) => r.metrics.turns ?? 0)),
    tokens: mean(items.map(totalTokens)),
    outputTokens: mean(items.map((r) => r.metrics.tokens.output)),
    cacheWrite: mean(items.map((r) => r.metrics.tokens.cacheWrite)),
    costUsd: mean(items.map((r) => r.metrics.costUsd).filter((v) => v !== null)),
    wallSec: mean(items.map((r) => r.wallMs / 1000)),
    timeouts: items.filter((r) => r.timedOut).length,
    permissionDenials: items.reduce((sum, r) => sum + (r.metrics.permissionDenials ?? 0), 0)
  };
}

const arms = [...new Set(records.map((r) => r.arm))].sort((a, b) => ["baseline", "skills", "skills-mcp"].indexOf(a) - ["baseline", "skills", "skills-mcp"].indexOf(b));
const hosts = [...new Set(records.map((r) => `${r.host}/${r.model}`))];
const byArm = Object.fromEntries(arms.map((arm) => [arm, aggregate(records.filter((r) => r.arm === arm))]));
const tasks = [...new Set(records.map((r) => r.task))].sort();

const perTask = tasks.map((task) => {
  const row = { task, category: records.find((r) => r.task === task).category };
  for (const arm of arms) {
    const items = records.filter((r) => r.task === task && r.arm === arm);
    row[arm] = {
      runs: items.length,
      success: items.filter((r) => r.score.success).length,
      falseReady: items.filter((r) => r.score.falseReady).length,
      statusCorrect: items.filter((r) => r.score.statusCorrect).length,
      costUsd: mean(items.map((r) => r.metrics.costUsd).filter((v) => v !== null)),
      tokens: mean(items.map(totalTokens)),
      skills: [...new Set(items.flatMap((r) => r.score.skillsSelected))],
      soturailCalls: items.reduce((sum, r) => sum + r.metrics.soturailCliCalls + r.metrics.soturailMcpCalls, 0),
      failedChecks: [...new Set(items.flatMap((r) => r.oracle.checks.filter((c) => !c.pass && c.kind !== "informational").map((c) => c.name)))]
    };
  }
  return row;
});

const summary = { schemaVersion: "soturail.qualification.summary.v1", runIds, hosts, generatedAt: new Date().toISOString(), records: records.length, byArm, perTask };
const outBase = path.join(SUITE_DIR, "results", runIds.join("+"));
writeFileSync(`${outBase}.summary.json`, `${JSON.stringify(summary, null, 2)}\n`);

const metricRows = [
  ["runs", (a) => a.runs],
  ["**functional success** (oracle)", (a) => pct(a.success)],
  ["regressions (visible suite broke)", (a) => pct(a.regressions)],
  ["**agent evidence**: ran a check after last edit", (a) => pct(a.checkAfterLastEdit)],
  ["**SotuRail evidence current** (runs with contracts)", (a) => (a.withContracts ? `${pct(a.evidenceCurrent)} of ${a.withContracts}` : "–")],
  ["**review/approval pending**", (a) => pct(a.reviewPending)],
  ["**undue technical block**", (a) => pct(a.undueBlock)],
  ["**final readiness claim correct** (review-pending counts as correct)", (a) => pct(a.claimCorrect)],
  ["  correct-ready / correct-not-ready / review-pending", (a) => `${a.outcomes["correct-ready"]} / ${a.outcomes["correct-not-ready"]} / ${a.outcomes["review-pending"]}`],
  ["  false-ready / false-not-ready / no claim", (a) => `${a.outcomes["false-ready"]} / ${a.outcomes["false-not-ready"]} / ${a.outcomes["no-claim"]}`],
  ["  classification basis", (a) => Object.entries(a.basis).map(([k, v]) => `${k}: ${v}`).join("; ")],
  ["false-verified", (a) => pct(a.falseVerified)],
  ["used SotuRail (skill/CLI/MCP)", (a) => pct(a.usedSoturail)],
  ["expected-skill recall", (a) => pct(a.skillRecall)],
  ["tool calls (mean)", (a) => num(a.toolCalls, 1)],
  ["duplicate tool calls (mean)", (a) => num(a.duplicateCalls, 2)],
  ["tool errors / recovered (mean)", (a) => `${num(a.toolErrors, 2)} / ${num(a.recoveredErrors, 2)}`],
  ["turns (mean)", (a) => num(a.turns, 1)],
  ["total tokens incl. cache (mean)", (a) => num(a.tokens)],
  ["output tokens (mean)", (a) => num(a.outputTokens)],
  ["cache-write tokens (mean)", (a) => num(a.cacheWrite)],
  ["cost USD, list price (mean)", (a) => num(a.costUsd, 3)],
  ["wall seconds (mean)", (a) => num(a.wallSec, 1)],
  ["timeouts", (a) => a.timeouts],
  ["permission denials", (a) => a.permissionDenials]
];

const lines = [
  `# Agent qualification report — ${runIds.join(" + ")}`,
  "",
  `Hosts/models: ${hosts.join(", ")}. Valid records: ${records.length}; excluded as invalid (host failure): ${invalidRuns.length}${invalidRuns.length ? ` (${[...new Set(invalidRuns.map((r) => r.invalid))].join("; ")})` : ""}. Generated ${summary.generatedAt}.`,
  "",
  "Scores come only from hidden oracles copied in after the agent exits; the agent never grades itself.",
  "",
  "## By arm",
  "",
  `| metric | ${arms.join(" | ")} |`,
  `|---|${arms.map(() => "---:").join("|")}|`,
  ...metricRows.map(([label, pick]) => `| ${label} | ${arms.map((arm) => pick(byArm[arm])).join(" | ")} |`),
  "",
  "## By task",
  "",
  `| task | category | ${arms.map((arm) => `${arm} pass`).join(" | ")} | ${arms.map((arm) => `${arm} cost`).join(" | ")} | SotuRail use |`,
  `|---|---|${arms.map(() => "---:").join("|")}|${arms.map(() => "---:").join("|")}|---|`,
  ...perTask.map((row) => `| ${row.task} | ${row.category} | ${arms.map((arm) => `${row[arm].success}/${row[arm].runs}${row[arm].falseReady ? ` (FR ${row[arm].falseReady})` : ""}`).join(" | ")} | ${arms.map((arm) => num(row[arm].costUsd, 3)).join(" | ")} | ${arms.filter((arm) => arm !== "baseline").map((arm) => `${arm}: ${row[arm].skills.join(",") || "no skill"}; ${row[arm].soturailCalls} call(s)`).join("<br>")} |`),
  "",
  "## Failed oracle checks",
  "",
  ...perTask.flatMap((row) => arms.filter((arm) => row[arm].failedChecks.length).map((arm) => `- ${row.task} / ${arm}: ${row[arm].failedChecks.join("; ")}`)),
  ""
];
writeFileSync(`${outBase}.report.md`, lines.join("\n"));
process.stdout.write(lines.join("\n"));
