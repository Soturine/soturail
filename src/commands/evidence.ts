import path from "node:path";
import type { Command } from "commander";
import { collectEvidence, reportEvidence, verifyEvidence } from "../core/evidence-provenance.js";

export function registerEvidenceCommand(program: Command): void {
  const evidence = program.command("evidence").description("Collect source-backed local evidence and provenance.");
  evidence.command("collect").action(async () => {
    const result = await collectEvidence();
    process.stdout.write(`Evidence collected: ${result.evidence.id}\nstatus: ${result.evidence.status}\npath: ${path.normalize(path.relative(process.cwd(), result.dir))}\n`);
  });
  evidence.command("verify").action(async () => {
    const result = await verifyEvidence();
    process.stdout.write(`Evidence verified: ${result.evidence.id}\nstatus: ${result.evidence.status}\nblockers: ${result.evidence.blockers.length}\n`);
  });
  evidence.command("report").action(async () => {
    const result = await reportEvidence();
    process.stdout.write(`Evidence report: ${result.evidence.id}\nstatus: ${result.evidence.status}\npath: ${path.normalize(path.relative(process.cwd(), path.join(result.dir, "report.md")))}\n`);
  });
}
