import type { Command } from "commander";
import { query } from "../api/client.ts";
import { TRANSCRIPTS_QUERY, TRANSCRIPTS_WITH_SUMMARIES_QUERY } from "../api/queries.ts";
import type { TranscriptListItem } from "../types/index.ts";
import { FirefliesApiError } from "../api/client.ts";
import { formatListMarkdown } from "../formatters/markdown.ts";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List meetings")
    .option("--limit <n>", "Number of meetings to return", "20")
    .option("--from <date>", "Start date (YYYY-MM-DD)")
    .option("--to <date>", "End date (YYYY-MM-DD)")
    .option("--search <query>", "Search keyword")
    .option("--participant <email>", "Filter by participant email")
    .option("--include-summaries", "Include AI summaries")
    .option("--md", "Output as Markdown table")
    .option("--json", "Output as JSON (default)")
    .action(async (opts: {
      limit: string;
      from?: string;
      to?: string;
      search?: string;
      participant?: string;
      includeSummaries?: boolean;
      md?: boolean;
    }) => {
      try {
        const variables: Record<string, unknown> = {
          limit: parseInt(opts.limit, 10),
        };
        if (opts.from) variables["fromDate"] = new Date(opts.from).toISOString();
        if (opts.to) variables["toDate"] = new Date(opts.to).toISOString();
        if (opts.participant) variables["participant_email"] = opts.participant;

        const gqlQuery = opts.includeSummaries
          ? TRANSCRIPTS_WITH_SUMMARIES_QUERY
          : TRANSCRIPTS_QUERY;

        let data = await query<{ transcripts: TranscriptListItem[] }>(gqlQuery, variables);

        // Client-side search filtering (Fireflies API doesn't have a search parameter)
        if (opts.search) {
          const term = opts.search.toLowerCase();
          data = {
            transcripts: data.transcripts.filter(
              (t) => t.title?.toLowerCase().includes(term),
            ),
          };
        }

        if (opts.md) {
          console.log(formatListMarkdown(data.transcripts));
        } else {
          console.log(JSON.stringify(data.transcripts, null, 2));
        }
      } catch (err) {
        if (err instanceof FirefliesApiError) {
          console.error(err.message);
        } else {
          console.error("Failed to list meetings:", err);
        }
        process.exit(1);
      }
    });
}
