import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { validateMermaidDiagram } from "../src/core/diagram-validator.js";
import { listEvaluationCases, runEvaluationSuite } from "../src/core/evaluation-suite.js";
import { routeContext } from "../src/core/context-intelligence.js";

describe("v0.6.1 evaluation suite", () => {
  it("lists the full local evaluation fixture groups", () => {
    const list = listEvaluationCases();

    expect(list).toContain("memory-recall-quality");
    expect(list).toContain("context-selection-quality");
    expect(list).toContain("reducer-quality");
    expect(list).toContain("diagram-validation-quality");
  });

  it("runs deterministic local evaluation cases and writes reports", async () => {
    const run = await runEvaluationSuite();
    const markdown = await readFile(run.reports.markdown, "utf8");

    expect(run.schemaVersion).toBe("soturail.eval.v1");
    expect(run.suite).toBe("v0.6.1");
    expect(run.summary.failed).toBe(0);
    expect(run.summary.passed).toBe(run.cases.length);
    expect(markdown).toContain("SotuRail Evaluation Report");
    expect(markdown).toContain("Token savings");
  });

  it("keeps context routing quality deterministic", () => {
    expect(routeContext("security policy").expert).toBe("security");
    expect(routeContext("release notes npm publish").expert).toBe("release");
    expect(routeContext("README docs tutorial").expert).toBe("docs");
    expect(routeContext("failing test source file").expert).toBe("code");
    expect(routeContext("workflow evidence").expert).toBe("workflow");
    expect(routeContext("remembered decision").expert).toBe("memory");
    expect(routeContext("compare ecosystem docs").expert).toBe("research");
  });

  it("validates diagram syntax and verification warnings cheaply", () => {
    const invalid = validateMermaidDiagram("not a diagram");
    const warning = validateMermaidDiagram("stateDiagram-v2\n  Draft --> Active\n  Active --> Closed\n");

    expect(invalid.valid).toBe(false);
    expect(invalid.findings.some((finding) => finding.severity === "error")).toBe(true);
    expect(warning.valid).toBe(true);
    expect(warning.findings.some((finding) => finding.message.includes("verification"))).toBe(true);
  });
});
