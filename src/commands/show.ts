import type { Command } from "commander";
import { query } from "../api/client.ts";
import { TRANSCRIPT_DETAIL_QUERY } from "../api/queries.ts";
import type { TranscriptDetail } from "../types/index.ts";
import { FirefliesApiError } from "../api/client.ts";
import { formatShowMarkdown } from "../formatters/markdown.ts";

export function registerShowCommand(program: Command): void {
  program
    .command("show")
    .description("Show full meeting detail")
    .argument("<id>", "Meeting/transcript ID")
    .option("--include-transcript", "Include the full transcript")
    .option("--summary-only", "Show only the AI summary (skip transcript)")
    .option("--transcript-only", "Show only the transcript (skip summary)")
    .option("--md", "Output as Markdown")
    .option("--json", "Output as JSON (default)")
    .action(async (id: string, opts: {
      includeTranscript?: boolean;
      summaryOnly?: boolean;
      transcriptOnly?: boolean;
      md?: boolean;
    }) => {
      try {
        const data = await query<{ transcript: TranscriptDetail }>(
          TRANSCRIPT_DETAIL_QUERY,
          { id },
        );

        const includeTranscript = opts.includeTranscript || opts.transcriptOnly;

        if (opts.md) {
          console.log(
            formatShowMarkdown(data.transcript, {
              summaryOnly: opts.summaryOnly,
              transcriptOnly: opts.transcriptOnly,
              includeTranscript,
            }),
          );
        } else {
          const output = { ...data.transcript } as Record<string, unknown>;
          if (!includeTranscript || opts.summaryOnly) {
            delete output["sentences"];
          }
          if (opts.transcriptOnly) {
            delete output["summary"];
          }
          console.log(JSON.stringify(output, null, 2));
        }
      } catch (err) {
        if (err instanceof FirefliesApiError) {
          console.error(err.message);
        } else {
          console.error("Failed to fetch meeting:", err);
        }
        process.exit(1);
      }
    });
}
