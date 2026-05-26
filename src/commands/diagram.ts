import type { Command } from "commander";
import { auditDiagram, createDiagram, diagramFromWorkflow, initDiagramRail, validateDiagrams } from "../core/diagram-rail.js";

export function registerDiagramCommand(program: Command): void {
  const diagram = program.command("diagram").description("Manage local Diagram Rail visual contracts.");

  diagram.command("init").description("Create Diagram Rail folders and index files.").action(async () => {
    process.stdout.write(await initDiagramRail());
  });

  diagram.command("new").description("Create a Mermaid diagram and .spec.md visual contract.").argument("<feature>", "Feature name").action(async (feature: string) => {
    const result = await createDiagram(feature);
    process.stdout.write(result.output);
  });

  diagram.command("audit").description("Audit one diagram file for Mermaid/spec hygiene.").argument("<file>", "Diagram file").action(async (file: string) => {
    const result = await auditDiagram(file);
    process.stdout.write(result.output);
  });

  diagram.command("validate").description("Validate all local docs/diagrams/*.md diagrams.").action(async () => {
    const result = await validateDiagrams();
    process.stdout.write(result.output);
  });

  diagram.command("from-workflow").description("Generate a workflow state diagram and visual contract.").argument("<id>", "Workflow id").action(async (id: string) => {
    const result = await diagramFromWorkflow(id);
    process.stdout.write(result.output);
  });
}
