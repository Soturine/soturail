import type { Command } from "commander";
import {
  decidePolicyItem,
  explainPolicyItem,
  listPolicyQueue,
  policyDoctor,
  renderPolicyQueue,
  validatePolicy
} from "../core/policy-rail.js";

export function registerPolicyCommand(program: Command): void {
  const policy = program.command("policy").description("Inspect local safety policy and approval queue.");

  policy.command("doctor").description("Check local policy and risky-action defaults.").action(async () => {
    process.stdout.write(await policyDoctor());
  });

  policy.command("queue").description("List pending risky-action approvals.").action(async () => {
    process.stdout.write(renderPolicyQueue(await listPolicyQueue()));
  });

  policy.command("approve").description("Approve a queued risky action.").argument("<id>", "Policy queue id").action(async (id: string) => {
    const decision = await decidePolicyItem(id, "approved");
    process.stdout.write(`Policy approved: ${decision.queueId}\ndecision_id: ${decision.id}\n`);
  });

  policy.command("reject").description("Reject a queued risky action.").argument("<id>", "Policy queue id").action(async (id: string) => {
    const decision = await decidePolicyItem(id, "rejected");
    process.stdout.write(`Policy rejected: ${decision.queueId}\ndecision_id: ${decision.id}\n`);
  });

  policy.command("explain").description("Explain a queued risky action.").argument("<id>", "Policy queue id").action(async (id: string) => {
    process.stdout.write(await explainPolicyItem(id));
  });

  policy.command("validate").description("Validate local policy queue and decision records.").action(async () => {
    process.stdout.write(await validatePolicy());
  });
}
