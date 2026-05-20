import type { Command } from "commander";
import { detectNativeEngine } from "../core/native-engine.js";

export function registerNativeCommand(program: Command): void {
  const native = program.command("native").description("Inspect the optional Rust native reducer engine.");

  native.command("doctor").description("Check native reducer availability.").action(async () => {
    const info = await detectNativeEngine();
    const lines = [
      "SotuRail native doctor",
      `available: ${info.available}`,
      `path: ${info.path ?? "not found"}`,
      `version: ${info.version ?? "unknown"}`,
      "checked_paths:",
      ...info.checked_paths.map((item) => `  - ${item}`)
    ];
    process.stdout.write(`${lines.join("\n")}\n`);
  });
}
