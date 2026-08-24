import { createHash } from "node:crypto";
import type { Command } from "commander";
import { AgtAcsGovernanceProvider, NativeMinimalGovernanceProvider } from "../core/governance.js";
import { createWorkspaceFingerprint } from "../core/workspace-fingerprint.js";

export function registerGovernanceCommand(program: Command): void {
  const governance = program.command("governance").description("Evaluate deterministic authority provider boundaries.");
  governance.command("doctor").action(async () => {
    const native = new NativeMinimalGovernanceProvider();
    const agt = new AgtAcsGovernanceProvider();
    process.stdout.write(`${JSON.stringify({ native: await native.health(), agtAcs: await agt.health(), validation: await native.validate() }, null, 2)}\n`);
  });
  governance.command("evaluate")
    .requiredOption("--capability <id>", "Canonical capability id")
    .requiredOption("--actor <id>", "Actor id")
    .option("--payload <json>", "Evaluated payload JSON", "{}")
    .option("--approved", "Record explicit approval")
    .action(async (options: { capability: string; actor: string; payload: string; approved?: boolean }) => {
      const payload = JSON.parse(options.payload) as unknown;
      const workspace = await createWorkspaceFingerprint();
      const result = await new NativeMinimalGovernanceProvider().evaluate("cli.evaluate", {
        actor: { id: options.actor, type: "agent" },
        capability: options.capability,
        workspaceFingerprint: workspace.fingerprint,
        approval: options.approved ? "approved" : "missing",
        payloadDigest: createHash("sha256").update(JSON.stringify(payload)).digest("hex")
      });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      if (result.verdict !== "allow") process.exitCode = 1;
    });
}
