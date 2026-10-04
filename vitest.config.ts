import { defineConfig } from "vitest/config";

// Windows CI runners spawn CLI subprocesses much more slowly; give integration
// tests a platform budget instead of per-test overrides. Assertions are unchanged.
const slowPlatform = process.platform === "win32";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
    testTimeout: slowPlatform ? 60_000 : 15_000,
    hookTimeout: slowPlatform ? 60_000 : 30_000
  }
});
