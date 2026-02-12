import type {
  FirefliesUser,
  TranscriptListItem,
  TranscriptDetail,
  Sentence,
} from "../types/index.ts";

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatUserMarkdown(user: FirefliesUser): string {
  const lines = [
    `# ${user.name}`,
    "",
    `**Email:** ${user.email}`,
    `**Transcripts:** ${user.num_transcripts}`,
    `**Minutes Consumed:** ${user.minutes_consumed}`,
    `**Admin:** ${user.is_admin ? "Yes" : "No"}`,
  ];
  return lines.join("\n") + "\n";
}

export function formatListMarkdown(meetings: TranscriptListItem[]): string {
  if (meetings.length === 0) return "No meetings found.\n";

  const lines: string[] = [
    "| Title | Date | Duration | Organizer | Participants |",
    "|-------|------|----------|-----------|--------------|",
  ];

  for (const m of meetings) {
    const date = m.dateString ?? "N/A";
    const dur = m.duration != null ? `${m.duration} min` : "N/A";
    const org = m.organizer_email ?? "N/A";
    const parts = m.participants?.join(", ") ?? "N/A";
    lines.push(`| ${m.title ?? "Untitled"} | ${date} | ${dur} | ${org} | ${parts} |`);
  }

  return lines.join("\n") + "\n";
}

function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

export function formatShowMarkdown(
  transcript: TranscriptDetail,
  options: { summaryOnly?: boolean; transcriptOnly?: boolean; includeTranscript?: boolean } = {},
): string {
  const lines: string[] = [];
  const summary = transcript.summary ?? {};

  // YAML frontmatter
  lines.push("---");
  lines.push(`id: ${transcript.id}`);
  lines.push(`title: "${(transcript.title ?? "Untitled").replace(/"/g, '\\"')}"`);
  lines.push(`date: ${transcript.dateString ?? ""}`);
  lines.push(`duration: ${transcript.duration ?? 0}`);
  lines.push("participants:");
  if (transcript.participants?.length) {
    for (const p of transcript.participants) {
      lines.push(`  - ${p}`);
    }
  }
  lines.push(`organizer: ${transcript.organizer_email ?? ""}`);
  if (summary.meeting_type) {
    lines.push(`meeting_type: "${summary.meeting_type}"`);
  }
  if (summary.keywords?.length) {
    lines.push("keywords:");
    for (const k of summary.keywords) {
      lines.push(`  - ${k}`);
    }
  }
  lines.push("source: fireflies");
  lines.push("---");
  lines.push("");

  // Title
  lines.push(`# ${transcript.title ?? "Untitled"}`);
  lines.push("");

  // Metadata
  lines.push(`**Date:** ${transcript.dateString ? formatDate(transcript.dateString) : "N/A"}`);
  lines.push(`**Duration:** ${transcript.duration ?? 0} minutes`);
  const speakerNames = transcript.speakers?.map((s) => s.name).join(", ") ?? "";
  lines.push(`**Participants:** ${speakerNames || transcript.participants?.join(", ") || "N/A"}`);
  lines.push("");

  // Summary sections
  if (!options.transcriptOnly) {
    if (summary.overview) {
      lines.push("## Overview");
      lines.push("");
      lines.push(summary.overview);
      lines.push("");
    }

    if (summary.topics_discussed) {
      lines.push("## Key Topics");
      lines.push("");
      lines.push(summary.topics_discussed);
      lines.push("");
    }

    if (summary.action_items) {
      lines.push("## Action Items");
      lines.push("");
      lines.push(summary.action_items);
      lines.push("");
    }

    if (summary.outline) {
      lines.push("## Outline");
      lines.push("");
      lines.push(summary.outline);
      lines.push("");
    }
  }

  // Transcript
  if ((options.includeTranscript || options.transcriptOnly) && !options.summaryOnly && transcript.sentences?.length) {
    lines.push("## Transcript");
    lines.push("");
    for (const s of transcript.sentences) {
      const ts = formatTimestamp(s.start_time);
      lines.push(`**${s.speaker_name}** (${ts}): ${s.text}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}
