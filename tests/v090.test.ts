import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { baselineSnapshot } from "../src/core/baseline-snapshot.js";
import { compareBenchmarkRail, readBenchmarkRailReport, renderBenchmarkList, runBenchmarkRail } from "../src/core/benchmark-rail.js";
import { buildWorkflowEvidence } from "../src/core/evidence-pack.js";
import { nativeCompare, nativeDoctor, nativeStatus, writeNativeCandidateReport } from "../src/core/native-candidates.js";
import { runReleasePreflight } from "../src/core/release-preflight.js";
import { SOTURAIL_VERSION } from "../src/core/version.js";
import { createWorkflowPlan } from "../src/core/workflow-store.js";

async function tempProject(version = "0.9.0"): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "soturail-v090-"));
  await mkdir(path.join(root, ".git"), { recursive: true });
  await mkdir(path.join(root, ".github", "workflows"), { recursive: true });
  await mkdir(path.join(root, "dist"), { recursive: true });
  await mkdir(path.join(root, "docs", "releases"), { recursive: true });
  await mkdir(path.join(root, "src", "core"), { recursive: true });
  await writeFile(path.join(root, "README.md"), "npx soturail --help\nnpm install -g soturail\nsoturail --version\n", "utf8");
  await writeFile(path.join(root, "CHANGELOG.md"), `## [${version}]\n\n- v0.9 fixture.\n`, "utf8");
  await writeFile(path.join(root, "LICENSE"), "MIT\n", "utf8");
  await writeFile(path.join(root, ".github", "workflows", "ci.yml"), "name: ci\n", "utf8");
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "soturail-fixture", version, bin: { soturail: "dist/cli.js" }, files: ["dist", "README.md", "LICENSE", "docs"] }, null, 2), "utf8");
  await writeFile(path.join(root, "package-lock.json"), JSON.stringify({ name: "soturail-fixture", version, lockfileVersion: 3, packages: { "": { name: "soturail-fixture", version } } }, null, 2), "utf8");
  await writeFile(path.join(root, "dist", "cli.js"), `if (process.argv.includes('--version')) console.log('${version}');\n`, "utf8");
  await writeFile(path.join(root, "src", "core", "version.ts"), `export const SOTURAIL_VERSION = "${version}";\n`, "utf8");
  await writeFile(path.join(root, "docs", "releases", `RELEASE_NOTES_v${version}.md`), "# Notes\n", "utf8");
  return root;
}

describe("v0.9.0 benchmark-gated native performance rails", () => {
  it("lists benchmark suites and writes Benchmark Rail 2 reports", async () => {
    const root = await tempProject();
    const list = renderBenchmarkList();
    const report = await runBenchmarkRail(root, "brain");
    const markdown = await readBenchmarkRailReport(root);
    const compare = await compareBenchmarkRail(root);
    const json = JSON.parse(await readFile(path.join(root, ".soturail", "bench", "latest.json"), "utf8")) as typeof report;

    expect(list).toContain("brain-scan");
    expect(list).toContain("release-preflight");
    expect(report.schemaVersion).toBe("soturail.bench.v1");
    expect(report.suite).toBe("brain");
    expect(report.environment.engine).toBe("typescript");
    expect(report.cases.some((item) => item.category === "brain-scan")).toBe(true);
    expect(report.cases.every((item) => item.durationMs >= 0)).toBe(true);
    expect(json.cases.length).toBe(report.cases.length);
    expect(markdown).toContain("Benchmark Rail 2");
    expect(compare).toContain("native_claim");
    expect(await readFile(path.join(root, "benchmarks", "reports", `bench-v${SOTURAIL_VERSION}.json`), "utf8")).toContain("soturail.bench.v1");
  });

  it("reports native candidates, status, doctor and compare with TypeScript fallback", async () => {
    const root = await tempProject();
    const candidates = await writeNativeCandidateReport(root);
    const status = await nativeStatus(root);
    const doctor = await nativeDoctor(root);
    const compare = await nativeCompare(root);

    expect(candidates.report.schemaVersion).toBe("soturail.native.candidates.v1");
    expect(candidates.report.engine.fallback).toBe("typescript");
    expect(candidates.report.engine.normalInstallRequiresNative).toBe(false);
    expect(candidates.report.candidates.some((item) => item.classification === "good-candidate")).toBe(true);
    expect(status.fallback).toBe("typescript");
    expect(status.npm_install_requires_native).toBe(false);
    expect(doctor).toContain("normal_npm_install_requires_rust: NO");
    expect(compare).toContain("typescript_fallback: OK");
    expect(await readFile(candidates.jsonPath, "utf8")).toContain("benchmark-before-native");
  });

  it("creates baseline reports for check zip bundle and pack modes", async () => {
    const root = await tempProject();
    const check = await baselineSnapshot(root, "check");
    const zip = await baselineSnapshot(root, "zip");
    const bundle = await baselineSnapshot(root, "bundle");
    const pack = await baselineSnapshot(root, "pack");
    const latest = await readFile(path.join(root, ".soturail", "baselines", "latest.json"), "utf8");

    expect(check.output).toContain("Do not manually zip");
    expect(check.report.signals.some((signal) => signal.id === "github_ci" && signal.ok)).toBe(true);
    expect(zip.output).toContain("git archive --format=zip");
    expect(bundle.output).toContain("git bundle create");
    expect(pack.output).toContain("npm pack");
    expect(latest).toContain("soturail.baseline.v1");
  });

  it("adds performance evidence references to release and workflow evidence", async () => {
    const root = await tempProject();
    await runBenchmarkRail(root, "brain");
    await writeNativeCandidateReport(root);
    await baselineSnapshot(root, "check");
    const release = await runReleasePreflight(root, { runAudit: false, runPack: false, cliCommand: [process.execPath, path.join(root, "dist", "cli.js"), "--version"] });
    const plan = await createWorkflowPlan("Performance evidence workflow", root);
    const evidence = await buildWorkflowEvidence(plan.record.id, root);

    expect(release.gates.some((gate) => gate.id === "benchmark_report" && gate.details.includes(".soturail"))).toBe(true);
    expect(release.gates.some((gate) => gate.id === "native_candidate_report" && gate.details.includes(".soturail"))).toBe(true);
    expect(release.gates.some((gate) => gate.id === "baseline_report" && gate.details.includes(".soturail"))).toBe(true);
    expect(release.gates.some((gate) => gate.id === "typescript_fallback" && gate.ok)).toBe(true);
    expect(evidence.content).toContain("## Performance Evidence");
    expect(evidence.content).toContain("latest_benchmark_json:");
    expect(evidence.content).toContain("native_candidate_report:");
    expect(evidence.content).toContain("baseline_report:");
  });
});
