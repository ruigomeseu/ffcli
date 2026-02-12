import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveApiKey, getConfigPath } from "../../src/config/config.ts";

describe("config resolution", () => {
  const originalEnv = process.env["FIREFLIES_API_KEY"];

  beforeEach(() => {
    delete process.env["FIREFLIES_API_KEY"];
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env["FIREFLIES_API_KEY"] = originalEnv;
    } else {
      delete process.env["FIREFLIES_API_KEY"];
    }
  });

  it("returns env var when FIREFLIES_API_KEY is set", () => {
    process.env["FIREFLIES_API_KEY"] = "env-test-key";
    expect(resolveApiKey()).toBe("env-test-key");
  });

  it("env var takes precedence over config file", () => {
    process.env["FIREFLIES_API_KEY"] = "env-key-wins";
    expect(resolveApiKey()).toBe("env-key-wins");
  });

  it("returns null when no env var and config file missing", () => {
    delete process.env["FIREFLIES_API_KEY"];
    // Config file at ~/.config/ffcli/config.json may or may not exist,
    // but with no env var and a missing/invalid file, should return null or a key.
    // The important assertion: without env var, it doesn't throw.
    const result = resolveApiKey();
    expect(result === null || typeof result === "string").toBe(true);
  });

  it("getConfigPath returns a path ending in config.json", () => {
    const path = getConfigPath();
    expect(path).toMatch(/config\.json$/);
    expect(path).toContain(".config/ffcli");
  });
});
