export const UNSAFE_CONFIRMATION = "I_UNDERSTAND_THIS_CAN_DESTROY_DATA";

export interface ValidationResult {
  ok: boolean;
  blocked: boolean;
  bypassed: boolean;
  reason?: string;
  matchedPattern?: string;
}

const dangerousPatterns: Array<{ name: string; pattern: RegExp; reason: string }> = [
  {
    name: "rm -rf",
    pattern: /\brm\s+(?:-[^\s]*r[^\s]*f|-[^\s]*f[^\s]*r)\b/i,
    reason: "recursive forced deletion is blocked by default"
  },
  {
    name: "sudo",
    pattern: /(^|[;&|]\s*)sudo\b/i,
    reason: "privileged commands are blocked by default"
  },
  {
    name: "format",
    pattern: /(^|[;&|]\s*)format(?:\.com)?\b/i,
    reason: "disk formatting commands are blocked by default"
  },
  {
    name: "dd if=",
    pattern: /\bdd\s+[^\n\r]*\bif=/i,
    reason: "raw disk copy commands are blocked by default"
  },
  {
    name: "curl | sh",
    pattern: /\bcurl\b[^\n\r|]*\|\s*(?:sh|bash|zsh|fish)\b/i,
    reason: "piping downloaded scripts into a shell is blocked by default"
  },
  {
    name: "wget | sh",
    pattern: /\bwget\b[^\n\r|]*\|\s*(?:sh|bash|zsh|fish)\b/i,
    reason: "piping downloaded scripts into a shell is blocked by default"
  },
  {
    name: "del /s",
    pattern: /(^|[;&|]\s*)del\s+\/s\b/i,
    reason: "recursive Windows deletion is blocked by default"
  },
  {
    name: "git push",
    pattern: /(^|[;&|]\s*)git\s+push\b/i,
    reason: "automatic git push is blocked by SotuRail"
  }
];

export function isDangerousCommand(command: string): boolean {
  return dangerousPatterns.some((entry) => entry.pattern.test(command));
}

export function validateCommand(command: string, unsafeConfirm?: string): ValidationResult {
  const match = dangerousPatterns.find((entry) => entry.pattern.test(command));
  if (!match) {
    return { ok: true, blocked: false, bypassed: false };
  }

  if (unsafeConfirm === UNSAFE_CONFIRMATION) {
    return {
      ok: true,
      blocked: false,
      bypassed: true,
      reason: match.reason,
      matchedPattern: match.name
    };
  }

  return {
    ok: false,
    blocked: true,
    bypassed: false,
    reason: `${match.reason}. To bypass, pass --unsafe-confirm "${UNSAFE_CONFIRMATION}" exactly.`,
    matchedPattern: match.name
  };
}
