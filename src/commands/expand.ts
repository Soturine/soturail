import type { Command } from "commander";
import { MetricsStore } from "../core/metrics-store.js";
import { RawStore } from "../core/raw-store.js";

export interface ExpandCliOptions {
  allowRaw?: boolean;
  yes?: boolean;
}

export async function expandRawLog(rawId: string, root = process.cwd()): Promise<Buffer> {
  const rawStore = new RawStore(root);
  const buffer = await rawStore.readRaw(rawId);
  if (!buffer) {
    throw new Error(`No raw log found for raw_id "${rawId}". Check .soturail/raw/index.jsonl or run soturail stats.`);
  }
  const metrics = new MetricsStore(root);
  await metrics.append({ type: "expand", raw_id: rawId });
  return buffer;
}

export function redactProbableSecrets(text: string): string {
  return text
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/g, "Bearer [SOTURAIL_REDACTED]")
    .replace(/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/g, "[SOTURAIL_REDACTED_GITHUB_TOKEN]")
    .replace(/\bnpm_[A-Za-z0-9]{20,}\b/g, "[SOTURAIL_REDACTED_NPM_TOKEN]")
    .replace(/\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g, "[SOTURAIL_REDACTED_API_KEY]")
    .replace(/\b(?:AIza|ya29\.|xox[baprs]-)[A-Za-z0-9._-]{20,}\b/g, "[SOTURAIL_REDACTED_TOKEN]")
    .replace(
      /^(\s*(?:API_KEY|TOKEN|SECRET|PASSWORD|NPM_TOKEN|GITHUB_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY)\s*=\s*)[^\r\n]+/gim,
      "$1[SOTURAIL_REDACTED]"
    )
    .replace(
      /("(?:api[_-]?key|token|secret|password|authorization)"\s*:\s*")[^"]+(")/gim,
      "$1[SOTURAIL_REDACTED]$2"
    );
}

export function registerExpandCommand(program: Command): void {
  program
    .command("expand")
    .description("Print the original raw log for a raw_id.")
    .argument("<raw_id>", "Raw log id from soturail run")
    .option("--allow-raw", "Print raw log without redacting probable secrets")
    .option("--yes", "Confirm raw output disclosure when --allow-raw is used")
    .action(async (rawId: string, options: ExpandCliOptions) => {
      const buffer = await expandRawLog(rawId);
      if (options.allowRaw && !options.yes) {
        throw new Error("Raw logs may contain secrets. Re-run with --allow-raw --yes to print unredacted output.");
      }
      if (options.allowRaw) {
        process.stderr.write("Warning: printing unredacted raw log. Review terminal history and shared output carefully.\n");
        process.stdout.write(buffer);
        return;
      }
      process.stdout.write(redactProbableSecrets(buffer.toString("utf8")));
    });
}
