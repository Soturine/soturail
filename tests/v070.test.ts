import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { auditDiagram, createDiagram, diagramFromWorkflow, initDiagramRail, validateDiagrams } from "../src/core/diagram-rail.js";
import { buildWorkflowEvidence } from "../src/core/evidence-pack.js";
import { runEvaluationSuite } from "../src/core/evaluation-suite.js";
import { harnessDoctor, initHarnessContract, noteHarnessFailure } from "../src/core/harness-rail.js";
import { runReleasePreflight } from "../src/core/release-preflight.js";
import { createWorkflowPlan, reviewWorkflow, setupWorkflowRail, verifyWorkflow, workflowWork } from "../src/core/workflow-store.js";

async function tempProject(version = "1.2.3"): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v070-"));
  await mkdir(path.join(root, "docs", "releases"), { recursive: true });
  await mkdir(path.join(root, "dist"), { recursive: true });
  await writeFile(path.join(root, "README.md"), "npx soturail --help\nnpm install -g soturail\nsoturail --version\n", "utf8");
  await writeFile(path.join(root, "CHANGELOG.md"), `## [${version}]\n\n- Test release.\n`, "utf8");
  await writeFile(path.join(root, "LICENSE"), "MIT\n", "utf8");
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "soturail", version }, null, 2), "utf8");
  await writeFile(path.join(root, "package-lock.json"), JSON.stringify({
    name: "soturail",
    version,
    lockfileVersion: 3,
    packages: { "": { name: "soturail", version } }
  }, null, 2), "utf8");
  await writeFile(path.join(root, "dist", "cli.js"), `if (process.argv.includes('--version')) console.log('${version}');\n`, "utf8");
  await writeFile(path.join(root, "docs", "releases", `RELEASE_NOTES_v${version}.md`), "# Notes\n", "utf8");
  return root;
}

describe("v0.7.0 workflow harness diagram rails", () => {
  it("uses docs/releases for release notes and release preflight", async () => {
    const root = await tempProject();
    const result = await runReleasePreflight(root, { runAudit: false, runPack: false });
    const releaseNotes = result.gates.find((gate) => gate.id === "release_notes");

    expect(releaseNotes?.ok).toBe(true);
    expect(releaseNotes?.details).toContain(path.join("docs", "releases", "RELEASE_NOTES_v1.2.3.md"));
  });

  it("creates workflow plans, work logs, reviews, verification and evidence", async () => {
    const root = await tempProject();
    await setupWorkflowRail(root);
    await initHarnessContract(root);

    const planned = await createWorkflowPlan("Ship workflow rail", root);
    await noteHarnessFailure("Diagram spec was missing verification transition", {
      workflow: planned.record.id,
      prevention: "diagram/spec update"
    }, root);
    const work = await workflowWork(planned.record.id, "Implemented deterministic local workflow phases.", root);
    const review = await reviewWorkflow(planned.record.id, { all: true }, root);
    const verify = await verifyWorkflow(planned.record.id, root);
    await runEvaluationSuite(root);
    await initDiagramRail(root);
    await diagramFromWorkflow(planned.record.id, root);
    await validateDiagrams(root);
    const evidence = await buildWorkflowEvidence(planned.record.id, root);

    expect(planned.output).toContain("phase: plan");
    expect(work).toContain("progress_appended");
    expect(review.output).toContain("security");
    expect(review.output).toContain("agent-readiness");
    expect(verify).toContain("harness_contract: present");
    expect(verify).toContain("verify_json:");
    expect(evidence.content).toContain("review_report:");
    expect(evidence.content).toContain("verify_report:");
    expect(evidence.content).toContain("diagram_validation:");
    expect(evidence.content).toContain("eval_report:");
    expect(evidence.content).toContain("release_notes:");
    expect(evidence.content).toContain("RELEASE_NOTES_v1.2.3.md");
    expect(evidence.content).toContain("Diagram spec was missing verification transition");
  });

  it("connects harness doctor output to active workflows and verification", async () => {
    const root = await tempProject();
    await setupWorkflowRail(root);
    await initHarnessContract(root);
    const planned = await createWorkflowPlan("Harness connected workflow", root);
    await noteHarnessFailure("Repeated release checklist omission", { workflow: planned.record.id, prevention: "workflow check" }, root);
    await verifyWorkflow(planned.record.id, root);

    const doctor = await harnessDoctor(root);

    expect(doctor).toContain(`active_workflow: ${planned.record.id}`);
    expect(doctor).toContain("contract_present: true");
    expect(doctor).toContain("failure_count: 1");
    expect(doctor).toContain("latest_verify_status: present");
    expect(doctor).toContain("suggested_prevention_action: workflow check");
  });

  it("creates, audits, validates and generates diagram visual contracts", async () => {
    const root = await tempProject();
    await setupWorkflowRail(root);
    const planned = await createWorkflowPlan("Diagram backed workflow", root);
    const init = await initDiagramRail(root);
    const created = await createDiagram("Checkout Flow", root);
    const audit = await auditDiagram(created.diagramPath, root);
    const generated = await diagramFromWorkflow(planned.record.id, root);
    const validation = await validateDiagrams(root);
    const spec = await readFile(created.specPath, "utf8");

    expect(init).toContain("SotuRail diagram init");
    expect(audit.output).toContain("contains_mermaid: true");
    expect(audit.output).toContain("matching_spec: true");
    expect(validation.output).toContain("diagrams_count:");
    expect(generated.output).toContain("SotuRail diagram from-workflow");
    expect(spec).toContain("## Required nodes");
    expect(spec).toContain("## Required transitions");
    expect(spec).toContain("## Evidence links");
    expect(spec).toContain("## Validation checklist");
    expect(spec).toContain("## Known gaps");
  });

  it("catches basic diagram hygiene issues", async () => {
    const root = await tempProject();
    const badPath = path.join(root, "bad.md");
    await writeFile(badPath, "# Bad diagram\n\n```mermaid\nnot really mermaid\n", "utf8");

    const audit = await auditDiagram(badPath, root);

    expect(audit.report.fenceOk).toBe(false);
    expect(audit.report.validation.findings.some((finding) => finding.message.includes("supported Mermaid"))).toBe(true);
    expect(audit.output).toContain("valid: false");
  });
});
