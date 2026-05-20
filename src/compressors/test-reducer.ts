export function isTestCommand(command: string, raw: string): boolean {
  return /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b/i.test(command) ||
    /\b(vitest|jest|pytest|mocha|mvn|gradle)\b/i.test(command) ||
    /\b(FAIL|FAILED|AssertionError|Traceback|Tests?:|BUILD FAILED|There (?:was|were) \d+ failure|Surefire)\b/i.test(raw);
}

const IMPORTANT =
  /\b(FAIL|FAILED|Error|AssertionError|Expected|Received|Traceback|Caused by|at\s+.+:\d+:\d+|\.test\.|\.spec\.|tests?\/|src[\\/].+:\d+|FAILED TESTS|BUILD FAILED|Surefire|Maven|Gradle|passed|failed|skipped|summary|Test Files|Tests|Snapshots|Time)\b/i;
const NOISE = /^\s*(PASS|✓|✔|ok)\s+/i;

export function reduceTestOutput(raw: string, rawId: string): string {
  const lines = raw.split(/\r?\n/);
  const important: string[] = [];
  const summary: string[] = [];
  const seen = new Set<string>();
  let passedNoise = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (NOISE.test(trimmed)) {
      passedNoise += 1;
      continue;
    }

    const key = trimmed.replace(/\s+/g, " ");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    if (IMPORTANT.test(trimmed)) {
      important.push(line);
    }

    if (/\b(Test Files|Tests|Snapshots|Time|passed|failed|skipped|errors?)\b/i.test(trimmed)) {
      summary.push(line);
    }
  }

  const sections = [
    "Test Output Summary",
    `Raw log: soturail expand ${rawId}`,
    "",
    "Summary counts:",
    ...(summary.length > 0 ? summary.slice(-20) : ["- no explicit test summary detected"]),
    "",
    "Failures, assertions, stack traces, and file paths:",
    ...(important.length > 0 ? important.slice(0, 160) : ["- no failure-looking lines detected"])
  ];

  if (passedNoise > 0) {
    sections.push("", `[Collapsed ${passedNoise} repeated passed/progress lines. Recover with: soturail expand ${rawId}]`);
  }

  return `${sections.join("\n").trimEnd()}\n`;
}
