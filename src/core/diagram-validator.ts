export interface DiagramValidationFinding {
  severity: "error" | "warning";
  message: string;
}

export interface DiagramValidationReport {
  schemaVersion: "soturail.diagram.validation.v1";
  valid: boolean;
  findings: DiagramValidationFinding[];
}

export function validateMermaidDiagram(input: string): DiagramValidationReport {
  const findings: DiagramValidationFinding[] = [];
  const text = extractMermaid(input);
  if (!text.trim()) {
    findings.push({ severity: "error", message: "No Mermaid content found." });
    return { schemaVersion: "soturail.diagram.validation.v1", valid: false, findings };
  }
  if (!/^\s*(stateDiagram-v2|flowchart\s+(TD|LR|BT|RL)|graph\s+(TD|LR|BT|RL))/m.test(text)) {
    findings.push({ severity: "error", message: "Diagram must start with a supported Mermaid stateDiagram, flowchart, or graph declaration." });
  }
  if (/stateDiagram-v2/.test(text)) {
    if (!/\[\*\]\s*-->/.test(text)) findings.push({ severity: "warning", message: "State diagram is missing an initial transition." });
    if (!/-->\s*Verifying|Verifying\s*-->/.test(text)) findings.push({ severity: "warning", message: "State diagram is missing a verification transition." });
    const states = collectStateNames(text);
    const targets = collectTargetStateNames(text);
    for (const state of states) {
      if (!targets.has(state) && !/Draft|Start|\[\*\]/i.test(state)) {
        findings.push({ severity: "warning", message: `State may be unreachable: ${state}` });
      }
    }
  }
  if (/flowchart|graph/.test(text) && /Publish|Release|NpmPublish|GitHubRelease/i.test(text) && !/Test|Audit|Pack|Verify/i.test(text)) {
    findings.push({ severity: "warning", message: "Release diagram should include test/audit/pack verification before publish/release." });
  }
  return {
    schemaVersion: "soturail.diagram.validation.v1",
    valid: findings.every((finding) => finding.severity !== "error"),
    findings
  };
}

function extractMermaid(input: string): string {
  const match = input.match(/```mermaid\s*([\s\S]*?)```/i);
  return match?.[1] ?? input;
}

function collectStateNames(text: string): Set<string> {
  const states = new Set<string>();
  for (const match of text.matchAll(/^\s*([A-Za-z][\w-]*)\s*-->/gm)) {
    if (match[1]) states.add(match[1]);
  }
  return states;
}

function collectTargetStateNames(text: string): Set<string> {
  const states = new Set<string>();
  for (const match of text.matchAll(/-->\s*([A-Za-z][\w-]*)/g)) {
    if (match[1]) states.add(match[1]);
  }
  return states;
}
