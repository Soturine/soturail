interface SummaryMarker {
  __soturail_compacted_array__: true;
  total_items: number;
  first_items: unknown[];
  last_items: unknown[];
}

interface PrimitivePath {
  path: string;
  value: string | number | boolean | null;
}

function compactValue(value: unknown, maxArrayItems: number): unknown {
  if (Array.isArray(value)) {
    if (value.length > maxArrayItems) {
      const firstCount = Math.min(10, maxArrayItems);
      const lastCount = Math.min(5, Math.max(0, maxArrayItems - firstCount));
      return {
        __soturail_compacted_array__: true,
        total_items: value.length,
        first_items: value.slice(0, firstCount).map((item) => compactValue(item, maxArrayItems)),
        last_items: value.slice(Math.max(firstCount, value.length - lastCount)).map((item) => compactValue(item, maxArrayItems))
      } satisfies SummaryMarker;
    }
    return value.map((item) => compactValue(item, maxArrayItems));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, compactValue(item, maxArrayItems)])
    );
  }

  return value;
}

export function compactJsonToon(input: string, maxArrayItems = 30): string | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const compacted = compactValue(parsed, maxArrayItems);
    const primitivePaths = collectPrimitivePaths(parsed).slice(0, 500);
    const compactedText = JSON.stringify(compacted);
    const label = compactedText.includes("__soturail_compacted_array__")
      ? "JSON TOON Lite compacted representation:"
      : "JSON TOON Lite minified valid JSON:";
    const paths = primitivePaths.length > 0
      ? `\nPrimitive value paths preserved:\n${primitivePaths.map((entry) => `${entry.path}: ${JSON.stringify(entry.value)}`).join("\n")}\n`
      : "\n";
    return `${label}\n${compactedText}${paths}`;
  } catch {
    return null;
  }
}

function collectPrimitivePaths(value: unknown, basePath = "$"): PrimitivePath[] {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    return [{ path: basePath, value: value as string | number | boolean | null }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectPrimitivePaths(item, `${basePath}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
      collectPrimitivePaths(item, `${basePath}.${key}`)
    );
  }
  return [];
}
