export interface GenericReduceOptions {
  rawId: string;
  firstLines?: number;
  lastLines?: number;
}

const ERROR_LINE =
  /\b(error|failed|failure|fatal|exception|traceback|assertion|assert|panic|warn|warning|denied|timeout|permission|refused)\b|^\s*at\s+.+:\d+:\d+/i;
const PATH_LINE = /(?:[A-Za-z]:)?[./\\]?[\w.-]+(?:[\\/][\w.-]+)+(?::\d+(?::\d+)?)?/;

function unique(lines: string[]): string[] {
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

export function reduceGenericStream(raw: string, options: GenericReduceOptions): string {
  const firstCount = options.firstLines ?? 25;
  const lastCount = options.lastLines ?? 20;
  const lines = raw.split(/\r?\n/);
  const first = lines.slice(0, firstCount);
  const last = lines.length > firstCount ? lines.slice(Math.max(firstCount, lines.length - lastCount)) : [];
  const errors = unique(lines.filter((line) => ERROR_LINE.test(line))).slice(0, 100);
  const paths = unique(lines.filter((line) => PATH_LINE.test(line))).slice(0, 80);
  const repeated = repeatedLineSummary(lines).slice(0, 40);
  const collapsed = Math.max(0, lines.length - first.length - last.length);

  const sections = [
    "Generic Stream Summary",
    `Raw log: soturail expand ${options.rawId}`,
    "",
    "First lines:",
    ...first
  ];

  if (errors.length > 0) {
    sections.push("", "Error-looking lines:", ...errors);
  }

  if (paths.length > 0) {
    sections.push("", "File paths and line references:", ...paths);
  }

  if (repeated.length > 0) {
    sections.push("", "Collapsed repeated lines:", ...repeated);
  }

  if (collapsed > 0) {
    sections.push("", `[Collapsed approximately ${collapsed} middle lines. Recover with: soturail expand ${options.rawId}]`);
  }

  if (last.length > 0) {
    sections.push("", "Last lines:", ...last);
  }

  return `${sections.join("\n").trimEnd()}\n`;
}

function repeatedLineSummary(lines: string[]): string[] {
  const counts = new Map<string, number>();
  for (const line of lines) {
    const key = line.trim();
    if (key.length > 0) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 2)
    .sort((left, right) => right[1] - left[1])
    .map(([line, count]) => `${count}x ${line}`);
}
