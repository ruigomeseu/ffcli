import { describe, it, expect } from "vitest";
import { formatListMarkdown } from "../../src/formatters/markdown.ts";
import type { TranscriptListItem } from "../../src/types/index.ts";

describe("list formatting", () => {
  const meetings: TranscriptListItem[] = [
    {
      id: "1",
      title: "Morning Standup",
      dateString: "2025-01-15",
      duration: 15,
      organizer_email: "alice@example.com",
      participants: ["alice@example.com", "bob@example.com"],
      speakers: [{ name: "Alice" }, { name: "Bob" }],
    },
    {
      id: "2",
      title: "Sprint Review",
      dateString: "2025-01-16",
      duration: 60,
      organizer_email: "charlie@example.com",
      participants: ["charlie@example.com"],
      speakers: [{ name: "Charlie" }],
    },
  ];

  describe("JSON output", () => {
    it("serializes meetings array as valid JSON", () => {
      const json = JSON.stringify(meetings, null, 2);
      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toHaveProperty("id", "1");
      expect(parsed[0]).toHaveProperty("title", "Morning Standup");
    });

    it("includes all expected fields", () => {
      const json = JSON.stringify(meetings[0], null, 2);
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty("id");
      expect(parsed).toHaveProperty("title");
      expect(parsed).toHaveProperty("dateString");
      expect(parsed).toHaveProperty("duration");
      expect(parsed).toHaveProperty("organizer_email");
      expect(parsed).toHaveProperty("participants");
      expect(parsed).toHaveProperty("speakers");
    });
  });

  describe("markdown table output", () => {
    it("renders a markdown table with headers", () => {
      const md = formatListMarkdown(meetings);
      expect(md).toContain("| Title |");
      expect(md).toContain("| Date |");
      expect(md).toContain("| Duration |");
      expect(md).toContain("|-------|");
    });

    it("includes meeting data in rows", () => {
      const md = formatListMarkdown(meetings);
      expect(md).toContain("Morning Standup");
      expect(md).toContain("Sprint Review");
      expect(md).toContain("15 min");
      expect(md).toContain("60 min");
    });

    it("renders empty message for no meetings", () => {
      const md = formatListMarkdown([]);
      expect(md).toBe("No meetings found.\n");
    });

    it("handles missing fields gracefully", () => {
      const partial: TranscriptListItem[] = [
        {
          id: "3",
          title: "",
          dateString: "",
          duration: 0,
          organizer_email: "",
          participants: [],
          speakers: [],
        },
      ];
      // Should not throw
      const md = formatListMarkdown(partial);
      expect(md).toContain("| Title |");
    });
  });

  describe("meetings with summaries", () => {
    it("JSON includes summary when present", () => {
      const withSummary: TranscriptListItem[] = [
        {
          ...meetings[0]!,
          summary: {
            overview: "Daily standup discussion.",
            action_items: "- Review PRs",
            topics_discussed: "- Sprint progress",
            keywords: ["standup", "sprint"],
            meeting_type: "Standup",
          },
        },
      ];
      const json = JSON.stringify(withSummary, null, 2);
      const parsed = JSON.parse(json);
      expect(parsed[0].summary).toHaveProperty("overview");
      expect(parsed[0].summary.keywords).toContain("standup");
    });
  });
});
