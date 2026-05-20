export function isGitCommand(command: string): boolean {
  return /\bgit\s+(status|diff|show|log|branch|checkout|merge|rebase|pull|fetch)\b/i.test(command);
}

export function reduceGitOutput(raw: string, rawId: string): string {
  const lines = raw.split(/\r?\n/);
  const changedFiles = new Set<string>();
  const preserved: string[] = [];
  let diffBodyLines = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const diffFile = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (diffFile?.[1]) {
      changedFiles.add(diffFile[1]);
      preserved.push(line);
      continue;
    }

    const statusFile = line.match(
      /^(?:\s*(?:modified|new file|deleted|renamed|copied|both modified|M|A|D|R|UU|AA|DD|\?\?)[:\s]+)(.+)$/i
    );
    if (statusFile?.[1]) {
      changedFiles.add(statusFile[1].trim());
      preserved.push(line);
      continue;
    }

    if (
      /^On branch\b/i.test(trimmed) ||
      /^Your branch\b/i.test(trimmed) ||
      /^Changes\b/i.test(trimmed) ||
      /^Untracked files\b/i.test(trimmed) ||
      /^no changes added\b/i.test(trimmed) ||
      /^nothing to commit\b/i.test(trimmed) ||
      /^@@\s/.test(trimmed) ||
      /^commit\s+[a-f0-9]{7,40}/i.test(trimmed) ||
      /^Author:/i.test(trimmed) ||
      /^Date:/i.test(trimmed) ||
      /^\*\s+/.test(trimmed) ||
      /^rename (?:from|to)\b/i.test(trimmed) ||
      /^deleted file mode\b/i.test(trimmed) ||
      /^new file mode\b/i.test(trimmed) ||
      /^(<<<<<<<|=======|>>>>>>>)\b/.test(trimmed) ||
      /^(fatal|error|warning):/i.test(trimmed) ||
      /^(index|---|\+\+\+)/.test(trimmed)
    ) {
      preserved.push(line);
      continue;
    }

    if (/^[+-]/.test(line)) {
      diffBodyLines += 1;
      if (diffBodyLines <= 80) {
        preserved.push(line);
      }
    }
  }

  const sections = [
    "Git Output Summary",
    `Raw log: soturail expand ${rawId}`,
    "",
    `Changed files (${changedFiles.size}):`,
    ...(changedFiles.size > 0 ? [...changedFiles].sort().map((file) => `- ${file}`) : ["- none detected"]),
    "",
    "Preserved status, errors, and hunk headers:",
    ...dedupePreservingOrder(preserved).slice(0, 200)
  ];

  if (diffBodyLines > 80) {
    sections.push("", `[Collapsed ${diffBodyLines - 80} repeated diff body lines. Recover with: soturail expand ${rawId}]`);
  }

  return `${sections.join("\n").trimEnd()}\n`;
}

function dedupePreservingOrder(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const key = line.trim();
    if (key.length === 0 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(line);
  }
  return result;
}
