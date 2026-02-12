import type { Command } from "commander";
import { query } from "../api/client.ts";
import { USER_QUERY } from "../api/queries.ts";
import type { FirefliesUser } from "../types/index.ts";
import { FirefliesApiError } from "../api/client.ts";
import { formatUserMarkdown } from "../formatters/markdown.ts";

export function registerMeCommand(program: Command): void {
  program
    .command("me")
    .description("Show current user info")
    .option("--md", "Output as Markdown")
    .option("--json", "Output as JSON (default)")
    .action(async (opts: { md?: boolean }) => {
      try {
        const data = await query<{ user: FirefliesUser }>(USER_QUERY);
        if (opts.md) {
          console.log(formatUserMarkdown(data.user));
        } else {
          console.log(JSON.stringify(data.user, null, 2));
        }
      } catch (err) {
        if (err instanceof FirefliesApiError) {
          console.error(err.message);
        } else {
          console.error("Failed to fetch user info:", err);
        }
        process.exit(1);
      }
    });
}
