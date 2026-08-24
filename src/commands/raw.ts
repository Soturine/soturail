import type { Command } from "commander";
import { inspectRaw, purgeRaw, rawDoctor, rawSensitivity, rawStatus } from "../core/raw-lifecycle.js";

export function registerRawCommand(program: Command): void {
  const raw = program.command("raw").description("Inspect and manage local raw-log sensitivity and retention.");
  raw.command("status").option("--json", "Print JSON").action(async () => {
    process.stdout.write(`${JSON.stringify(await rawStatus(), null, 2)}\n`);
  });
  raw.command("doctor").action(async () => {
    const result = await rawDoctor();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.ok) process.exitCode = 1;
  });
  raw.command("inspect").argument("<id>", "Raw log id").option("--redacted", "Print content with mandatory redaction").action(async (id: string, options: { redacted?: boolean }) => {
    if (!options.redacted) throw new Error("Raw inspect requires --redacted. Unredacted disclosure is not available through this command.");
    const result = await inspectRaw(id);
    process.stdout.write(`${JSON.stringify({ metadata: result.metadata, redactions: result.redactions }, null, 2)}\n--- redacted content ---\n${result.redacted}`);
  });
  raw.command("sensitivity").argument("<id>", "Raw log id").action(async (id: string) => {
    process.stdout.write(`${JSON.stringify(await rawSensitivity(id), null, 2)}\n`);
  });
  raw.command("purge").requiredOption("--ttl <duration>", "Retention TTL such as 30d").option("--dry-run", "Preview only (default)").option("--execute", "Delete matched raw payloads and rewrite the index").option("--yes", "Confirm deletion with --execute").action(async (options: { ttl: string; execute?: boolean; yes?: boolean }) => {
    const result = await purgeRaw(options);
    process.stdout.write(`${JSON.stringify({ dryRun: options.execute !== true, ...result }, null, 2)}\n`);
  });
}
