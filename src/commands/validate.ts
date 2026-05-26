import type { Command } from "commander";
import { renderJsonValidation, validateJsonFile } from "../core/json-validator.js";

export function registerValidateCommand(program: Command): void {
  const validate = program.command("validate").description("Validate local structured payloads before agent handoff.");

  validate
    .command("json")
    .description("Validate JSON payloads with optional strict local safety checks.")
    .argument("<file>", "JSON file")
    .option("--strict", "Warn on duplicate keys, probable secrets and huge arrays")
    .action(async (file: string, options: { strict?: boolean }) => {
      process.stdout.write(renderJsonValidation(await validateJsonFile(file, { strict: options.strict === true })));
    });
}
