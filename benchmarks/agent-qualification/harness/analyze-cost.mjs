#!/usr/bin/env node
// Where do SotuRail-arm tokens go? Reads kept transcripts (no new agent runs) and attributes
// tool output bytes to command kinds, plus repeated reads of the same file within a run.
//   node harness/analyze-cost.mjs <run-id> [arm-regex]
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { SUITE_DIR } from "./lib.mjs";

const [runId, armPattern = "__skills(-mcp)?__"] = process.argv.slice(2);
if (!runId) throw new Error("usage: analyze-cost.mjs <run-id> [arm-regex]");
const dir = path.join(SUITE_DIR, "results", runId);
const GROUPED = new Set(["contract", "evidence", "candidates", "skills", "capabilities", "raw", "context", "governance", "knowledge"]);
const READ_PATTERN = /(?:Get-Content|cat|type|soturail(?:\.cmd)? read)\s+(?:-Raw\s+)?["']?([\w./\\-]+\.(?:js|mjs|ts|py|md|json|txt))/g;

function kindOf(command) {
  if (/SKILL\.md/.test(command)) return "read SKILL.md";
  const match = command.match(/soturail(?:\.cmd)?\s+([a-z-]+)(?:\s+([a-z-]+))?/);
  if (match) return `soturail ${match[1]}${GROUPED.has(match[1]) && match[2] ? ` ${match[2]}` : ""}`;
  if (/node --test|npm (run )?test|unittest|pytest/.test(command)) return "native test";
  if (/Get-Content|\bcat\b|\btype\b|Select-String|\brg\b|grep/.test(command)) return "native read/search";
  return "other shell";
}

const totals = {};
const reads = { total: 0, repeated: 0 };
let runs = 0;
for (const entry of readdirSync(dir)) {
  if (!new RegExp(armPattern).test(entry)) continue;
  const file = path.join(dir, entry, "transcript.jsonl");
  const record = path.join(dir, entry, "record.json");
  if (!existsSync(file) || (existsSync(record) && JSON.parse(readFileSync(record, "utf8")).invalid)) continue;
  runs += 1;
  const seen = new Set();
  const note = (key) => { reads.total += 1; if (seen.has(key)) reads.repeated += 1; seen.add(key); };
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.startsWith("{")) continue;
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    const item = event.item;
    if (event.type !== "item.completed" || !item) continue;
    let kind = null;
    let bytes = 0;
    if (item.type === "command_execution") {
      const command = String(item.command ?? "");
      kind = kindOf(command);
      bytes = String(item.aggregated_output ?? "").length;
      for (const match of command.matchAll(READ_PATTERN)) note(match[1].replace(/\\/g, "/"));
    } else if (item.type === "mcp_tool_call") {
      kind = `mcp ${item.tool}`;
      bytes = JSON.stringify(item.result ?? "").length;
      if (item.tool === "soturail.read") note(String(item.arguments?.file ?? ""));
    }
    if (!kind) continue;
    totals[kind] ??= { calls: 0, bytes: 0 };
    totals[kind].calls += 1;
    totals[kind].bytes += bytes;
  }
}

process.stdout.write(`${runId} ${armPattern}: ${runs} runs; file reads ${reads.total}, repeated within a run ${reads.repeated}\n`);
for (const [kind, value] of Object.entries(totals).sort((a, b) => b[1].bytes - a[1].bytes)) {
  process.stdout.write(`${kind.padEnd(28)} calls/run ${(value.calls / runs).toFixed(1).padStart(5)}   KB/run ${(value.bytes / runs / 1024).toFixed(1).padStart(6)}   bytes/call ${String(Math.round(value.bytes / value.calls)).padStart(6)}\n`);
}
