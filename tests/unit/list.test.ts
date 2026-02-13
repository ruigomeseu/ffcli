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

  describe("date range variable conversion", () => {
    it("converts --from date string to ISO format", () => {
      const from = "2025-01-01";
      const iso = new Date(from).toISOString();
      expect(iso).toBe("2025-01-01T00:00:00.000Z");
    });

    it("converts --to date string to ISO format", () => {
      const to = "2025-01-31";
      const iso = new Date(to).toISOString();
      expect(iso).toBe("2025-01-31T00:00:00.000Z");
    });

    it("builds variables with fromDate and toDate when provided", () => {
      const opts = { limit: "20", from: "2025-01-01", to: "2025-01-31" };
      const variables: Record<string, unknown> = {
        limit: parseInt(opts.limit, 10),
      };
      if (opts.from) variables["fromDate"] = new Date(opts.from).toISOString();
      if (opts.to) variables["toDate"] = new Date(opts.to).toISOString();

      expect(variables).toEqual({
        limit: 20,
        fromDate: "2025-01-01T00:00:00.000Z",
        toDate: "2025-01-31T00:00:00.000Z",
      });
    });

    it("builds variables with participant_email when provided", () => {
      const opts = { limit: "20", participant: "alice@example.com" };
      const variables: Record<string, unknown> = {
        limit: parseInt(opts.limit, 10),
      };
      if (opts.participant) variables["participant_email"] = opts.participant;

      expect(variables).toEqual({
        limit: 20,
        participant_email: "alice@example.com",
      });
    });

    it("omits fromDate and toDate when not provided", () => {
      const opts = { limit: "10" } as { limit: string; from?: string; to?: string };
      const variables: Record<string, unknown> = {
        limit: parseInt(opts.limit, 10),
      };
      if (opts.from) variables["fromDate"] = new Date(opts.from).toISOString();
      if (opts.to) variables["toDate"] = new Date(opts.to).toISOString();

      expect(variables).toEqual({ limit: 10 });
      expect(variables).not.toHaveProperty("fromDate");
      expect(variables).not.toHaveProperty("toDate");
    });
  });

  describe("client-side search filtering", () => {
    it("filters meetings by title keyword (case-insensitive)", () => {
      const filtered = meetings.filter(
        (t) => t.title?.toLowerCase().includes("standup"),
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0]!.title).toBe("Morning Standup");
    });

    it("returns empty array when no titles match", () => {
      const filtered = meetings.filter(
        (t) => t.title?.toLowerCase().includes("nonexistent"),
      );
      expect(filtered).toHaveLength(0);
    });

    it("matches partial title strings", () => {
      const filtered = meetings.filter(
        (t) => t.title?.toLowerCase().includes("sprint"),
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0]!.title).toBe("Sprint Review");
    });

    it("matches case-insensitively", () => {
      const filtered = meetings.filter(
        (t) => t.title?.toLowerCase().includes("MORNING".toLowerCase()),
      );
      expect(filtered).toHaveLength(1);
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
