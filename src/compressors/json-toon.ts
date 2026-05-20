interface PrimitivePath {
  path: string;
  value: string | number | boolean | null;
  relevant: boolean;
  order: number;
}

export interface JsonToonMetrics {
  primitive_values_preserved_count: number;
  error_values_preserved_count: number;
  structural_keys_reduced_count: number;
  arrays_collapsed_count: number;
  original_json_valid: boolean;
  reduced_representation_valid: boolean;
}

export interface JsonToonResult {
  text: string;
  metrics: JsonToonMetrics;
}

export function compactJsonToon(input: string, maxPrimitiveLines = 160): string | null {
  return compactJsonToonWithMetrics(input, maxPrimitiveLines)?.text ?? null;
}

export function compactJsonToonWithMetrics(input: string, maxPrimitiveLines = 160): JsonToonResult | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const primitives = collectPrimitivePaths(parsed).filter(shouldKeepPrimitive);
    const relevant = prioritizePrimitives(primitives).slice(0, maxPrimitiveLines);
    const arrays = collectArraySummaries(parsed);
    const objectKeys = collectObjectKeys(parsed);
    const text = [
      "JSON TOON Lite compressed representation:",
      "Not a byte-equivalent JSON document; recover original with soturail expand <raw_id>.",
      "",
      "Relevant primitive paths:",
      ...(relevant.length > 0 ? relevant.map((entry) => `${entry.path}: ${JSON.stringify(entry.value)}`) : ["- none detected"]),
      "",
      "Collapsed arrays:",
      ...(arrays.length > 0 ? arrays : ["- none collapsed"]),
      "",
      `Structural keys summarized: ${objectKeys.size}`
    ].join("\n") + "\n";

    return {
      text,
      metrics: {
        primitive_values_preserved_count: relevant.length,
        error_values_preserved_count: relevant.filter((entry) => entry.relevant).length,
        structural_keys_reduced_count: objectKeys.size,
        arrays_collapsed_count: arrays.length,
        original_json_valid: true,
        reduced_representation_valid: false
      }
    };
  } catch {
    return null;
  }
}

function collectPrimitivePaths(value: unknown, basePath = "$", orderRef = { value: 0 }): PrimitivePath[] {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    const order = orderRef.value;
    orderRef.value += 1;
    return [{ path: basePath, value: value as string | number | boolean | null, relevant: isRelevant(basePath, value), order }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => {
      if (index < 3 || index >= value.length - 2 || containsRelevantPrimitive(item)) {
        return collectPrimitivePaths(item, `${basePath}[${index}]`, orderRef);
      }
      return [];
    });
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
      collectPrimitivePaths(item, `${basePath}.${key}`, orderRef)
    );
  }
  return [];
}

function prioritizePrimitives(entries: PrimitivePath[]): PrimitivePath[] {
  return [...entries].sort((left, right) => primitiveRank(right) - primitiveRank(left) || left.order - right.order);
}

function collectArraySummaries(value: unknown, basePath = "$"): string[] {
  if (Array.isArray(value)) {
    const own = value.length > 12 ? [`${basePath}: ${value.length} items`] : [];
    return [
      ...own,
      ...value.slice(0, 8).flatMap((item, index) => collectArraySummaries(item, `${basePath}[${index}]`))
    ];
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
      collectArraySummaries(item, `${basePath}.${key}`)
    );
  }
  return [];
}

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.slice(0, 12).forEach((item) => collectObjectKeys(item, keys));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      keys.add(key);
      collectObjectKeys(item, keys);
    }
  }
  return keys;
}

function containsRelevantPrimitive(value: unknown): boolean {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    return isRelevant("", value);
  }
  if (Array.isArray(value)) {
    return value.some(containsRelevantPrimitive);
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([key, item]) => isRelevant(key, item) || containsRelevantPrimitive(item));
  }
  return false;
}

function shouldKeepPrimitive(entry: PrimitivePath): boolean {
  if (entry.value === null) {
    return false;
  }
  if (entry.relevant) {
    return true;
  }
  return isSamplePrimitive(entry.path);
}

function primitiveRank(entry: PrimitivePath): number {
  const path = entry.path.toLowerCase();
  const valueText = String(entry.value).toLowerCase();
  let score = 0;
  if (entry.relevant) score += 1000;
  if (/^\$\.(status|message|path|file|error|code|reason)$/.test(path)) score += 500;
  if (/\.(error|exception|message|reason)$/.test(path) && entry.value !== null) score += 300;
  if (/\.(path|file)$/.test(path)) score += 250;
  if (/\b(denied|timeout|failed|failure|exception|traceback|permission|refused)\b/.test(valueText)) score += 250;
  if (entry.value === false) score += 150;
  if (isSamplePrimitive(path)) score += 25;
  score -= Math.min(path.length, 200) / 100;
  return score;
}

function isSamplePrimitive(path: string): boolean {
  const lower = path.toLowerCase();
  return /\[(0|1|2)\]\.(id|ok|status|path|file)$/.test(lower) || /\[\d+\]\.(id|ok|status|path|file)$/.test(lower) && /\[(11[89]|[1-9]\d{2,})\]/.test(lower);
}

function isRelevant(path: string, value: unknown): boolean {
  if (value === null) {
    return false;
  }
  if (value === false) {
    return true;
  }
  const text = `${path} ${String(value)}`.toLowerCase();
  if (/\b(error|failed|failure|exception|traceback|denied|timeout|permission|refused)\b/.test(text)) {
    return true;
  }
  return /\b(status|message|path|file|code|reason)\b/.test(path.toLowerCase()) && String(value).length > 0;
}
