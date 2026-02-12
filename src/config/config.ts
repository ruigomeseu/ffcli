import { join } from "node:path";
import { homedir } from "node:os";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, chmod } from "node:fs/promises";
import type { AppConfig } from "../types/index.ts";

const CONFIG_DIR = join(homedir(), ".config", "ffcli");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function resolveApiKey(): string | null {
  const envKey = process.env["FIREFLIES_API_KEY"];
  if (envKey) return envKey;

  try {
    if (!existsSync(CONFIG_FILE)) return null;
    const content = readFileSync(CONFIG_FILE, "utf-8");
    const config: AppConfig = JSON.parse(content);
    return config.apiKey || null;
  } catch {
    return null;
  }
}

export async function saveApiKey(apiKey: string): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  const config: AppConfig = { apiKey };
  await Bun.write(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n");
  await chmod(CONFIG_FILE, 0o600);
}
