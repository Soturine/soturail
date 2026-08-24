import path from "node:path";
import { getWorkspacePaths } from "./config.js";

export type ArtifactPathId =
  | "artifacts"
  | "brain"
  | "capabilities"
  | "contracts"
  | "evals"
  | "evidence"
  | "index"
  | "knowledge"
  | "migrations"
  | "outcomes"
  | "raw"
  | "receipts"
  | "runs";

export class ArtifactRegistry {
  private readonly paths: Record<ArtifactPathId, string>;

  constructor(root = process.cwd()) {
    const workspace = getWorkspacePaths(root);
    this.paths = {
      artifacts: workspace.artifactsDir,
      brain: workspace.brainDir,
      capabilities: workspace.capabilitiesDir,
      contracts: workspace.contractsDir,
      evals: workspace.evalsDir,
      evidence: workspace.evidenceDir,
      index: workspace.localIndexDir,
      knowledge: workspace.knowledgeDir,
      migrations: workspace.migrationsDir,
      outcomes: workspace.outcomesDir,
      raw: workspace.rawDir,
      receipts: workspace.receiptsDir,
      runs: workspace.runsDir
    };
  }

  resolve(id: ArtifactPathId, ...segments: string[]): string {
    const base = this.paths[id];
    const target = path.resolve(base, ...segments);
    const relative = path.relative(base, target);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`Artifact path escapes registry root: ${id}`);
    return target;
  }

  entries(): ReadonlyArray<{ id: ArtifactPathId; path: string }> {
    return Object.entries(this.paths).map(([id, value]) => ({ id: id as ArtifactPathId, path: value }));
  }
}
