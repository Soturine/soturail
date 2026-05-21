export type DeveloperReducerKind =
  | "npm-install"
  | "tsc"
  | "docker"
  | "eslint"
  | "build"
  | "java"
  | "generic-dev";

const PATH_WITH_LINE = /(?:[A-Za-z]:)?[./\\]?[\w.-]+(?:[\\/][\w.-]+)+(?::\d+(?::\d+)?)?/;
const TSC_LINE = /(?:^|\s)(?:[A-Za-z]:)?[./\\]?[\w.-]+(?:[\\/][\w.-]+)*\w+\.(?:ts|tsx|js|jsx)\(\d+,\d+\):\s+error\s+TS\d+:/i;
const JAVA_STACK = /^\s*at\s+[\w.$]+\(.*\.java:\d+\)/;
const IMPORTANT = /\b(error|failed|failure|fatal|exception|traceback|assertion|warn|warning|security|vulnerabilit(?:y|ies)|audit|deprecated|denied|timeout|permission|refused|ELIFECYCLE|ERR!|TS\d+|BUILD FAILED|BUILD SUCCESSFUL)\b/i;
const SUMMARY = /\b(added \d+ packages|audited \d+ packages|found \d+ vulnerabilities|npm audit|compiled|built|build failed|build succeeded|errors? found|warnings? found|Tests? run|BUILD (?:SUCCESSFUL|FAILED))\b/i;
const COMMAND_SUGGESTION = /^\s*(npm|pnpm|yarn|bun|npx|node|tsc|eslint|docker|mvn|gradle|java)\b/i;
const NOISE = /^(?:\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]\s*)?$|^\s*(?:added|resolved|reused|downloaded)\s+\d+\s*$/i;

export function developerReducerKind(command: string, raw: string): DeveloperReducerKind | null {
  if (/\b(?:npm|pnpm|yarn|bun)\s+(?:i|install|add)\b/i.test(command)) return "npm-install";
  if (/\btsc\b/i.test(command) || TSC_LINE.test(raw)) return "tsc";
  if (/\bdocker\s+logs\b/i.test(command)) return "docker";
  if (/\beslint\b/i.test(command)) return "eslint";
  if (/\b(?:vite|next)\s+build\b/i.test(command) || /\b(vite|next)\b.+\b(error|warning|build)\b/i.test(raw)) return "build";
  if (/\b(java|mvn|maven|gradle)\b/i.test(command) || /Exception in thread|Caused by:|\.java:\d+/.test(raw)) return "java";
  return null;
}

export function reduceDeveloperOutput(command: string, raw: string, rawId: string, kind = developerReducerKind(command, raw) ?? "generic-dev"): string {
  const lines = raw.split(/\r?\n/);
  const important = unique(lines.filter((line) => IMPORTANT.test(line) || TSC_LINE.test(line) || JAVA_STACK.test(line))).slice(0, 180);
  const paths = unique(lines.filter((line) => PATH_WITH_LINE.test(line) || TSC_LINE.test(line) || JAVA_STACK.test(line))).slice(0, 120);
  const summaries = unique(lines.filter((line) => SUMMARY.test(line))).slice(-50);
  const commands = unique(lines.filter((line) => COMMAND_SUGGESTION.test(line))).slice(0, 40);
  const repeated = repeatedLineSummary(lines).slice(0, 30);
  const firstSignals = unique(lines.filter((line) => line.trim() && !NOISE.test(line))).slice(0, 20);

  const sections = [
    `${titleFor(kind)} Summary`,
    `Command: ${command}`,
    `Raw log: soturail expand ${rawId}`,
    "",
    "Important errors, warnings, and security lines:",
    ...(important.length > 0 ? important : ["- none detected"]),
    "",
    "File paths, line references, and stack frames:",
    ...(paths.length > 0 ? paths : ["- none detected"])
  ];

  if (summaries.length > 0) {
    sections.push("", "Final summaries:", ...summaries);
  }
  if (commands.length > 0) {
    sections.push("", "Command suggestions:", ...commands);
  }
  if (repeated.length > 0) {
    sections.push("", "Collapsed repeated noise:", ...repeated);
  }
  sections.push("", "First non-noise lines:", ...firstSignals);
  return `${sections.join("\n").trimEnd()}\n`;
}

function titleFor(kind: DeveloperReducerKind): string {
  switch (kind) {
    case "npm-install": return "npm install";
    case "tsc": return "TypeScript compiler";
    case "docker": return "Docker logs";
    case "eslint": return "ESLint";
    case "build": return "Build";
    case "java": return "Java/Maven/Gradle";
    default: return "Developer output";
  }
}

function unique(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const key = line.trim().replace(/\s+/g, " ");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(line);
  }
  return result;
}

function repeatedLineSummary(lines: string[]): string[] {
  const counts = new Map<string, number>();
  for (const line of lines) {
    const key = line.trim();
    if (key.length === 0 || IMPORTANT.test(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 2)
    .sort((left, right) => right[1] - left[1])
    .map(([line, count]) => `${count}x ${line}`);
}
