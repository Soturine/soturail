#!/usr/bin/env node
// Runs tasks × arms × repetitions with a real agent and scores every run with the hidden oracle.
//
//   node harness/run.mjs --host claude --tasks all --arms baseline,skills --reps 1 \
//     --model sonnet --max-budget 3 --timeout-min 20 --parallel 2 --run-id pilot-001
//
// Each run happens in a fresh temp workspace outside this repository, under a neutral
// path: the product name must not leak into the baseline's context through the cwd. Records land in
// results/<run-id>/<task>__<arm>__r<rep>/ (record.json, final.md, diff.patch, transcript.jsonl).
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ARMS, PROMPT_SUFFIX, SUITE_DIR, diffStat, ensureSoturail, evaluate, findHostBinary, hostVersion,
  infraFailure, loadTasks, oracleDigest, prepareWorkspace, runClaude, runCodex, scoreRun, sha256, visibleTests
} from "./lib.mjs";

function parseArgs(argv) {
  const options = { host: "claude", tasks: "all", arms: "baseline,skills", reps: 1, model: null, effort: null, maxBudget: 3, timeoutMin: 20, parallel: 1, runId: null, soturailVersion: "1.6.0", seed: 1, keep: false };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i].replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (key === "keep") { options.keep = true; continue; }
    options[key] = argv[++i];
  }
  options.reps = Number(options.reps);
  options.maxBudget = Number(options.maxBudget);
  options.timeoutMin = Number(options.timeoutMin);
  options.parallel = Number(options.parallel);
  options.seed = Number(options.seed);
  options.arms = options.arms.split(",");
  for (const arm of options.arms) if (!ARMS.includes(arm)) throw new Error(`unknown arm ${arm}`);
  options.runId ??= `${options.host}-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}`;
  return options;
}

// Deterministic shuffle so arm order inside a task does not track time-of-day or rate limits.
function shuffled(items, seed) {
  const out = [...items];
  let state = seed;
  for (let i = out.length - 1; i > 0; i -= 1) {
    state = (state * 1103515245 + 12345) % 2147483648;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function runOne(job, ctx) {
  const { task, arm, rep } = job;
  const name = `${task.id}__${arm}__r${rep}`;
  const outDir = path.join(ctx.resultsDir, name);
  if (existsSync(path.join(outDir, "record.json"))) return JSON.parse(readFileSync(path.join(outDir, "record.json"), "utf8"));
  mkdirSync(outDir, { recursive: true });
  const workDir = path.join(ctx.workRoot, name);
  const prompt = `${task.prompt}\n${PROMPT_SUFFIX}`;
  const startedAt = new Date().toISOString();
  const workspace = prepareWorkspace(task, workDir, { arm, host: ctx.options.host, soturail: ctx.soturail });
  const visibleBefore = visibleTests(task, workDir);
  const agentArgs = {
    binary: ctx.binary, dir: workDir, prompt, arm, model: ctx.options.model, effort: ctx.options.effort,
    maxBudgetUsd: ctx.options.maxBudget, timeoutMs: ctx.options.timeoutMin * 60000,
    transcriptFile: path.join(outDir, "transcript.jsonl"), soturail: ctx.soturail, runDir: outDir
  };
  const agent = ctx.options.host === "codex" ? await runCodex(agentArgs) : await runClaude(agentArgs);
  const { metrics } = agent;
  const invalid = infraFailure(agent);
  const visibleAfter = visibleTests(task, workDir);
  const changes = diffStat(workDir);
  const oracle = evaluate(task, workDir, metrics.finalMessage);
  const score = scoreRun({ task, oracle, metrics, visibleBefore, visibleAfter });
  const record = {
    schemaVersion: "soturail.qualification.run.v1",
    runId: ctx.options.runId, task: task.id, category: task.category, stack: task.stack, locale: task.locale, arm, rep,
    host: ctx.options.host, hostVersion: ctx.hostVersion, model: metrics.model ?? ctx.options.model, effort: ctx.options.effort,
    soturailVersion: arm === "baseline" ? null : ctx.soturail.version,
    promptSha256: sha256(prompt), fixtureHead: workspace.head, onboarding: workspace.onboarding?.map(({ command, code }) => ({ command, code })) ?? null,
    limits: { maxBudgetUsd: ctx.options.maxBudget, timeoutMin: ctx.options.timeoutMin },
    startedAt, wallMs: agent.wallMs, timedOut: agent.timedOut, exitCode: agent.code, stderrTail: agent.stderr.slice(-800),
    visibleBefore: visibleBefore.pass, visibleAfter: visibleAfter.pass,
    changedFiles: changes.changedFiles,
    invalid, oracle, score, oracleDigest: oracleDigest(task),
    metrics: { ...metrics, finalMessage: undefined },
    transcriptSha256: sha256(agent.stdout)
  };
  writeFileSync(path.join(outDir, "final.md"), metrics.finalMessage ?? "");
  writeFileSync(path.join(outDir, "diff.patch"), changes.diff);
  writeFileSync(path.join(outDir, "record.json"), `${JSON.stringify(record, null, 2)}\n`);
  return record;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const tasks = loadTasks(options.tasks);
  const needsSoturail = options.arms.some((arm) => arm !== "baseline");
  const soturail = needsSoturail ? ensureSoturail(options.soturailVersion) : null;
  const binary = findHostBinary(options.host);
  const ctx = {
    options, soturail, binary, hostVersion: hostVersion(binary),
    resultsDir: path.join(SUITE_DIR, "results", options.runId),
    workRoot: path.join(os.tmpdir(), "aq-runs", options.runId)
  };
  mkdirSync(ctx.resultsDir, { recursive: true });
  writeFileSync(path.join(ctx.resultsDir, "run.json"), `${JSON.stringify({ ...options, hostVersion: ctx.hostVersion, soturailVersion: soturail?.version ?? null, node: process.version, platform: `${process.platform}-${process.arch}`, startedAt: new Date().toISOString(), tasks: tasks.map((task) => task.id) }, null, 2)}\n`);

  const jobs = [];
  for (let rep = 1; rep <= options.reps; rep += 1) {
    for (const [index, task] of tasks.entries()) {
      for (const arm of shuffled(options.arms, options.seed + rep * 97 + index)) jobs.push({ task, arm, rep });
    }
  }
  process.stdout.write(`run ${options.runId}: ${jobs.length} job(s), host ${options.host} ${ctx.hostVersion}, soturail ${soturail?.version ?? "-"}\n`);

  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      try {
        const record = await runOne(job, ctx);
        const s = record.score;
        process.stdout.write(`${record.invalid ? "INVALID" : s.success ? "PASS" : "FAIL"} ${record.task} ${record.arm} r${record.rep}  status=${s.claims.status ?? "-"} verified=${s.claims.verified ?? "-"} falseReady=${s.falseReady} cost=${record.metrics.costUsd?.toFixed?.(3) ?? "-"} wall=${Math.round(record.wallMs / 1000)}s tools=${record.metrics.toolCalls} soturail=${record.metrics.soturailCliCalls}+${record.metrics.soturailMcpCalls}mcp skills=[${s.skillsSelected.join(",")}]\n`);
      } catch (error) {
        process.stdout.write(`ERROR ${job.task.id} ${job.arm} r${job.rep}: ${error.stack ?? error}\n`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, options.parallel) }, worker));
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
