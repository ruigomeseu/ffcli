import type { Command } from "commander";
import { query } from "../api/client.ts";
import { USER_QUERY } from "../api/queries.ts";
import { resolveApiKey, saveApiKey } from "../config/config.ts";
import type { FirefliesUser } from "../types/index.ts";
import { FirefliesApiError } from "../api/client.ts";

export function registerAuthCommand(program: Command): void {
  program
    .command("auth")
    .description("Store and verify your Fireflies API key")
    .argument("[key]", "API key to save")
    .option("--check", "Verify the stored/env API key works")
    .action(async (key: string | undefined, opts: { check?: boolean }) => {
      if (opts.check) {
        const existing = resolveApiKey();
        if (!existing) {
          console.error("No API key found. Run `ffcli auth` or set FIREFLIES_API_KEY.");
          process.exit(1);
        }
        try {
          const data = await query<{ user: FirefliesUser }>(USER_QUERY);
          console.log(`Authenticated as ${data.user.name} (${data.user.email})`);
        } catch (err) {
          if (err instanceof FirefliesApiError) {
            console.error(err.message);
          } else {
            console.error("Authentication check failed:", err);
          }
          process.exit(1);
        }
        return;
      }

      if (!key) {
        console.error("Usage: ffcli auth <KEY>");
        console.error("       ffcli auth --check");
        process.exit(1);
      }

      // Temporarily set env var so query() picks it up
      const prevKey = process.env["FIREFLIES_API_KEY"];
      process.env["FIREFLIES_API_KEY"] = key;
      try {
        const data = await query<{ user: FirefliesUser }>(USER_QUERY);
        // Restore env before saving
        if (prevKey !== undefined) {
          process.env["FIREFLIES_API_KEY"] = prevKey;
        } else {
          delete process.env["FIREFLIES_API_KEY"];
        }
        await saveApiKey(key);
        console.log(`Authenticated as ${data.user.name} (${data.user.email})`);
        console.log("API key saved.");
      } catch (err) {
        // Restore env on failure
        if (prevKey !== undefined) {
          process.env["FIREFLIES_API_KEY"] = prevKey;
        } else {
          delete process.env["FIREFLIES_API_KEY"];
        }
        if (err instanceof FirefliesApiError) {
          console.error(err.message);
        } else {
          console.error("Authentication failed:", err);
        }
        process.exit(1);
      }
    });
}
