export type ResponseMode = "normal" | "concise" | "ultra" | "review" | "commit" | "debug" | "docs";

export const responseModes: ResponseMode[] = ["normal", "concise", "ultra", "review", "commit", "debug", "docs"];

export interface ResponsePolicy {
  mode: ResponseMode;
  preserveCodeBlocks: boolean;
  preserveCommands: boolean;
  preservePaths: boolean;
  preserveSecurityWarnings: boolean;
}

export function buildResponsePolicy(mode: ResponseMode): ResponsePolicy {
  return {
    mode,
    preserveCodeBlocks: true,
    preserveCommands: true,
    preservePaths: true,
    preserveSecurityWarnings: true
  };
}

export function isResponseMode(value: string): value is ResponseMode {
  return responseModes.includes(value as ResponseMode);
}
