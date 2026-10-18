#!/usr/bin/env node
// Oracle quality gate (no agent involved). For every task:
//   negative control — the untouched fixture must FAIL the functional oracle;
//   positive control — the reference solution must PASS it, including claim checks;
//   mutants — plausible-but-wrong solutions (tasks/<id>/mutants/<name>/) must be rejected;
//   visible baseline — records whether the visible suite passes before any change.
// An oracle that fails either control cannot score agent runs.
import os from "node:os";
import path from "node:path";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { applyOverlay, applyReference, evaluate, loadTasks, prepareWorkspace, visibleTests } from "./lib.mjs";

const filter = process.argv[2] ?? "all";
const root = path.join(os.tmpdir(), `qual-oracles-${Date.now()}`);
let failures = 0;

for (const task of loadTasks(filter)) {
  const negDir = path.join(root, task.id, "negative");
  prepareWorkspace(task, negDir);
  const visible = visibleTests(task, negDir);
  const negative = evaluate(task, negDir, "");

  const posDir = path.join(root, task.id, "positive");
  prepareWorkspace(task, posDir);
  const finalMessage = applyReference(task, posDir);
  const positive = evaluate(task, posDir, finalMessage);
  const claimsOk = positive.checks.filter((check) => check.kind === "claim").every((check) => check.pass);

  const mutantsDir = path.join(task.dir, "mutants");
  const mutants = existsSync(mutantsDir) ? readdirSync(mutantsDir) : [];
  const survivors = [];
  for (const name of mutants) {
    const mutDir = path.join(root, task.id, `mutant-${name}`);
    prepareWorkspace(task, mutDir);
    const mutantMessage = applyOverlay(path.join(mutantsDir, name), mutDir);
    const result = evaluate(task, mutDir, mutantMessage);
    const rejected = !result.pass || result.checks.some((check) => check.kind === "claim" && !check.pass);
    if (!rejected) survivors.push(name);
  }

  const ok = !negative.pass && positive.pass && claimsOk && survivors.length === 0;
  if (!ok) failures += 1;
  process.stdout.write(`${ok ? "OK  " : "BAD "} ${task.id}  visible-before=${visible.pass ? "pass" : "fail"}  negative=${negative.pass ? "PASS(!)" : "fail"}  positive=${positive.pass ? "pass" : "FAIL(!)"}  claims=${claimsOk ? "ok" : "WRONG"}  mutants=${mutants.length - survivors.length}/${mutants.length}${survivors.length ? ` SURVIVED: ${survivors.join(",")}` : ""}\n`);
  if (!ok || process.env.QUAL_VERBOSE) {
    for (const [label, result] of [["negative", negative], ["positive", positive]]) {
      for (const check of result.checks) process.stdout.write(`       ${label} ${check.pass ? "✓" : "✗"} [${check.kind}] ${check.name}: ${String(check.detail).slice(0, 300)}\n`);
    }
  }
}

rmSync(root, { recursive: true, force: true });
process.stdout.write(failures ? `\n${failures} oracle(s) failed their controls\n` : "\nall oracles passed negative and positive controls\n");
process.exitCode = failures ? 1 : 0;
