export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function tokenEstimateNote(): string {
  return "Token counts are deterministic local estimates using Math.ceil(text.length / 4); they are not provider billing numbers.";
}
