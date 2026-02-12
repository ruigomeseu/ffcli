import { describe, it, expect } from "vitest";
import {
  formatTimestamp,
  formatUserMarkdown,
  formatListMarkdown,
  formatShowMarkdown,
} from "../../src/formatters/markdown.ts";
import type {
  FirefliesUser,
  TranscriptListItem,
  TranscriptDetail,
} from "../../src/types/index.ts";

describe("formatTimestamp", () => {
  it("formats seconds < 60 as M:SS", () => {
    expect(formatTimestamp(5)).toBe("0:05");
    expect(formatTimestamp(45)).toBe("0:45");
  });

  it("formats minutes correctly", () => {
    expect(formatTimestamp(65)).toBe("1:05");
    expect(formatTimestamp(600)).toBe("10:00");
  });

  it("formats hours correctly", () => {
    expect(formatTimestamp(3661)).toBe("1:01:01");
    expect(formatTimestamp(7200)).toBe("2:00:00");
  });
});

describe("formatUserMarkdown", () => {
  it("formats user info", () => {
    const user: FirefliesUser = {
      user_id: "123",
      name: "Alice",
      email: "alice@example.com",
      num_transcripts: 42,
      minutes_consumed: 1500,
      is_admin: true,
    };
    const result = formatUserMarkdown(user);
    expect(result).toContain("# Alice");
    expect(result).toContain("**Email:** alice@example.com");
    expect(result).toContain("**Transcripts:** 42");
    expect(result).toContain("**Admin:** Yes");
  });
});

describe("formatListMarkdown", () => {
  it("renders empty list message", () => {
    expect(formatListMarkdown([])).toBe("No meetings found.\n");
  });

  it("renders markdown table with meetings", () => {
    const meetings: TranscriptListItem[] = [
      {
        id: "1",
        title: "Standup",
        dateString: "2025-01-15",
        duration: 15,
        organizer_email: "alice@example.com",
        participants: ["alice@example.com", "bob@example.com"],
        speakers: [{ name: "Alice" }, { name: "Bob" }],
      },
    ];
    const result = formatListMarkdown(meetings);
    expect(result).toContain("| Title |");
    expect(result).toContain("Standup");
    expect(result).toContain("15 min");
  });
});

describe("formatShowMarkdown", () => {
  const transcript: TranscriptDetail = {
    id: "abc123",
    title: "Q4 Review",
    dateString: "2025-01-15T10:00:00Z",
    duration: 45,
    organizer_email: "alice@example.com",
    participants: ["alice@example.com", "bob@example.com"],
    speakers: [{ name: "Alice" }, { name: "Bob" }],
    summary: {
      overview: "Discussed Q4 results.",
      action_items: "- Follow up on revenue targets",
      topics_discussed: "- Revenue\n- Marketing",
      keywords: ["Q4", "revenue"],
      meeting_type: "Team Meeting",
      outline: "1. Intro\n2. Review",
    },
    sentences: [
      { speaker_name: "Alice", start_time: 0, end_time: 15, text: "Welcome everyone." },
      { speaker_name: "Bob", start_time: 15, end_time: 30, text: "Thanks Alice." },
    ],
  };

  it("includes YAML frontmatter", () => {
    const result = formatShowMarkdown(transcript);
    expect(result).toMatch(/^---\n/);
    expect(result).toContain("id: abc123");
    expect(result).toContain("source: fireflies");
    expect(result).toContain("---\n");
  });

  it("includes summary sections", () => {
    const result = formatShowMarkdown(transcript);
    expect(result).toContain("## Overview");
    expect(result).toContain("Discussed Q4 results.");
    expect(result).toContain("## Action Items");
    expect(result).toContain("## Key Topics");
    expect(result).toContain("## Outline");
  });

  it("excludes transcript by default", () => {
    const result = formatShowMarkdown(transcript);
    expect(result).not.toContain("## Transcript");
  });

  it("includes transcript with timestamps when includeTranscript is set", () => {
    const result = formatShowMarkdown(transcript, { includeTranscript: true });
    expect(result).toContain("## Transcript");
    expect(result).toContain("**Alice** (0:00): Welcome everyone.");
    expect(result).toContain("**Bob** (0:15): Thanks Alice.");
  });

  it("respects summaryOnly option", () => {
    const result = formatShowMarkdown(transcript, { summaryOnly: true });
    expect(result).toContain("## Overview");
    expect(result).not.toContain("## Transcript");
  });

  it("respects transcriptOnly option", () => {
    const result = formatShowMarkdown(transcript, { transcriptOnly: true });
    expect(result).not.toContain("## Overview");
    expect(result).toContain("## Transcript");
  });

  it("includes keywords in frontmatter", () => {
    const result = formatShowMarkdown(transcript);
    expect(result).toContain("keywords:");
    expect(result).toContain("  - Q4");
    expect(result).toContain("  - revenue");
  });
});
