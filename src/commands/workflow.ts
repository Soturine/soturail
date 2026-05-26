import type { Command } from "commander";
import path from "node:path";
import { buildWorkflowEvidence } from "../core/evidence-pack.js";
import {
  createWorkflowPlan,
  closeWorkflow,
  createWorkflow,
  cleanupClosedWorkflows,
  currentWorkflowId,
  listWorkflows,
  planWorkflow,
  readWorkflow,
  renderWorkflow,
  renderWorkflowList,
  reviewWorkflow,
  setupWorkflowRail,
  startWorkflow,
  statusWorkflow,
  verifyWorkflow,
  workflowWork
} from "../core/workflow-store.js";
import { diagramFromWorkflow } from "../core/diagram-rail.js";

export function registerWorkflowCommand(program: Command): void {
  const workflow = program.command("workflow").description("Manage safe local Workflow Rail tasks.");

  workflow
    .command("new")
    .description("Create a local workflow task.")
    .argument("<title>", "Task title")
    .action(async (title: string) => {
      const record = await createWorkflow(title);
      process.stdout.write(`Workflow created: ${record.id}\nstate: ${record.state}\n`);
    });

  workflow.command("list").description("List local workflows.").action(async () => {
    process.stdout.write(renderWorkflowList(await listWorkflows()));
  });

  workflow.command("show").description("Show a workflow record.").argument("<id>", "Workflow id").action(async (id: string) => {
    process.stdout.write(renderWorkflow(await readWorkflow(id)));
  });

  workflow.command("setup").description("Create or validate Workflow Rail 2.0 scaffold.").action(async () => {
    process.stdout.write(await setupWorkflowRail());
  });

  workflow.command("plan").description("Create a Workflow Rail 2.0 plan, or mark an existing workflow id planned.").argument("<title-or-id>", "Task title or workflow id").action(async (value: string) => {
    const existing = await readWorkflow(value).catch(() => null);
    if (existing) {
      process.stdout.write(renderWorkflow(await planWorkflow(value)));
      return;
    }
    const result = await createWorkflowPlan(value);
    process.stdout.write(result.output);
  });

  workflow.command("work").description("Append Workflow Rail work progress and link local evidence.").argument("[id]", "Workflow id; defaults to current workflow").option("--note <text>", "Progress note").action(async (id: string | undefined, options: { note?: string }) => {
    process.stdout.write(await workflowWork(id, options.note));
  });

  workflow.command("review").description("Run deterministic workflow review perspectives.").argument("[id]", "Workflow id; defaults to current workflow").option("--all", "Run all review perspectives").option("--perspective <name>", "security, docs, tests, release, context, or agent-readiness").action(async (id: string | undefined, options: { all?: boolean; perspective?: string }) => {
    const result = await reviewWorkflow(id, options);
    process.stdout.write(result.output);
  });

  workflow
    .command("start")
    .description("Start a workflow, optionally using a local Git worktree.")
    .argument("<id>", "Workflow id")
    .option("--worktree", "Create or plan local Git worktree isolation")
    .option("--dry-run", "Print worktree plan without creating it")
    .action(async (id: string, options: { worktree?: boolean; dryRun?: boolean }) => {
      process.stdout.write(await startWorkflow(id, options));
    });

  workflow.command("status").description("Show workflow status.").argument("<id>", "Workflow id").action(async (id: string) => {
    process.stdout.write(await statusWorkflow(id));
  });

  workflow.command("verify").description("Aggregate safe workflow verification evidence.").argument("[id]", "Workflow id; defaults to current workflow").action(async (id: string | undefined) => {
    const workflowId = id ?? await currentWorkflowId();
    if (!workflowId) throw new Error("No current workflow found. Run: soturail workflow plan \"Task title\"");
    process.stdout.write(await verifyWorkflow(workflowId));
  });

  workflow.command("evidence").description("Write a local evidence pack for a workflow.").argument("<id>", "Workflow id").action(async (id: string) => {
    const result = await buildWorkflowEvidence(id);
    process.stdout.write(`Workflow evidence written: ${path.normalize(path.relative(process.cwd(), result.path))}\n`);
  });

  workflow.command("diagram").description("Generate a workflow state diagram and visual contract.").argument("<id>", "Workflow id").action(async (id: string) => {
    const result = await diagramFromWorkflow(id);
    process.stdout.write(result.output);
  });

  workflow.command("close").description("Close a workflow.").argument("<id>", "Workflow id").action(async (id: string) => {
    const before = await readWorkflow(id);
    const closed = await closeWorkflow(id);
    process.stdout.write(renderWorkflow(closed));
    process.stdout.write(before.state === "closed" ? "already_closed: true\n" : "closed: true\n");
  });

  workflow
    .command("cleanup")
    .description("Review or remove closed workflow records.")
    .option("--closed", "Target closed workflows")
    .option("--dry-run", "Print planned cleanup without deleting")
    .option("--yes", "Confirm reviewed cleanup")
    .action(async (options: { closed?: boolean; dryRun?: boolean; yes?: boolean }) => {
      if (!options.closed) throw new Error("Only workflow cleanup --closed is currently supported.");
      const cleanupOptions: { dryRun?: boolean; yes?: boolean } = { dryRun: options.dryRun ?? !options.yes };
      if (options.yes !== undefined) cleanupOptions.yes = options.yes;
      const result = await cleanupClosedWorkflows(cleanupOptions);
      process.stdout.write(`${result.lines.join("\n")}\n`);
    });
}
