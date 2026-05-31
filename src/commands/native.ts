import type { Command } from "commander";
import { detectNativeEngine } from "../core/native-engine.js";
import { nativeCompare, nativeDoctor, nativeStatus, renderNativeStatus, writeNativeCandidateReport } from "../core/native-candidates.js";

export function registerNativeCommand(program: Command): void {
  const native = program.command("native").description("Inspect the optional Rust native reducer engine.");

  native.command("status").description("Report native availability and TypeScript fallback status.").action(async () => {
    process.stdout.write(renderNativeStatus(await nativeStatus()));
  });

  native.command("candidates").description("Classify benchmark-gated native acceleration candidates.").option("--json", "Print machine-readable JSON").action(async (options: { json?: boolean }) => {
    const result = await writeNativeCandidateReport();
    process.stdout.write(options.json ? `${JSON.stringify(result.report, null, 2)}\n` : result.output);
  });

  native.command("doctor").description("Check native reducer availability.").action(async () => {
    const info = await detectNativeEngine();
    const lines = [
      "SotuRail native doctor",
      `available: ${info.available}`,
      `path: ${info.path ?? "not found"}`,
      `version: ${info.version ?? "unknown"}`,
      `typescript_fallback: ${info.available ? "available if --engine ts is selected" : "active"}`,
      "native_required_for_npm_install: false",
      "rust_or_cargo_required_for_cli: false",
      "note: native acceleration is optional; the TypeScript reducer path remains the default fallback.",
      "checked_paths:",
      ...info.checked_paths.map((item) => `  - ${item}`)
    ];
    process.stdout.write(`${lines.join("\n")}\n`);
    process.stdout.write(await nativeDoctor());
  });

  native.command("compare").description("Compare TypeScript and native readiness without failing when native is unavailable.").action(async () => {
    process.stdout.write(await nativeCompare());
  });
}
