import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";

const hasApiKey = !!process.env["FIREFLIES_API_KEY"];
const TEST_TIMEOUT = 30000;

function run(args: string): string {
  return execSync(`bun run src/index.ts ${args}`, {
    cwd: process.cwd(),
    encoding: "utf-8",
    env: process.env,
    timeout: 30000,
  });
}

describe.runIf(hasApiKey)("e2e: auth", () => {
  it("auth --check succeeds with valid key", () => {
    const result = run("auth --check");
    expect(result).toContain("Authenticated as");
  }, TEST_TIMEOUT);
});

describe.runIf(hasApiKey)("e2e: me", () => {
  it("me returns user info as JSON", () => {
    const result = run("me");
    const user = JSON.parse(result);
    expect(user).toHaveProperty("name");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("num_transcripts");
  }, TEST_TIMEOUT);

  it("me --md returns markdown", () => {
    const result = run("me --md");
    expect(result).toContain("**Email:**");
  }, TEST_TIMEOUT);
});

describe.runIf(hasApiKey)("e2e: list", () => {
  it("list --limit 1 returns one meeting as JSON", () => {
    const result = run("list --limit 1");
    const meetings = JSON.parse(result);
    expect(Array.isArray(meetings)).toBe(true);
    expect(meetings.length).toBeLessThanOrEqual(1);
    if (meetings.length > 0) {
      expect(meetings[0]).toHaveProperty("id");
      expect(meetings[0]).toHaveProperty("title");
    }
  }, TEST_TIMEOUT);

  it("list --limit 1 --md returns markdown table", () => {
    const result = run("list --limit 1 --md");
    expect(result).toContain("| Title |");
  }, TEST_TIMEOUT);

  it("list --limit 1 --include-summaries includes summary fields", () => {
    const result = run("list --limit 1 --include-summaries");
    const meetings = JSON.parse(result);
    if (meetings.length > 0) {
      expect(meetings[0]).toHaveProperty("summary");
    }
  }, TEST_TIMEOUT);

  it("list --from and --to filters by date range", () => {
    // Use the last 30 days as a reasonable range
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fromStr = from.toISOString().split("T")[0];
    const toStr = to.toISOString().split("T")[0];
    const result = run(`list --limit 3 --from ${fromStr} --to ${toStr}`);
    const meetings = JSON.parse(result);
    expect(Array.isArray(meetings)).toBe(true);
  }, TEST_TIMEOUT);

  it("list --from and --to with narrow range returns fewer results", () => {
    // A date range far in the past should return no meetings
    const result = run("list --limit 5 --from 2000-01-01 --to 2000-01-02");
    const meetings = JSON.parse(result);
    expect(Array.isArray(meetings)).toBe(true);
    expect(meetings.length).toBe(0);
  }, TEST_TIMEOUT);

  it("list --participant filters by participant email", () => {
    // First get a meeting to find a real participant
    const listResult = run("list --limit 1");
    const meetings = JSON.parse(listResult);
    if (meetings.length === 0) return;
    const participant = meetings[0].participants?.[0] ?? meetings[0].organizer_email;
    if (!participant) return;

    const result = run(`list --limit 5 --participant ${participant}`);
    const filtered = JSON.parse(result);
    expect(Array.isArray(filtered)).toBe(true);
    for (const m of filtered) {
      expect(m.participants).toContain(participant);
    }
  }, TEST_TIMEOUT);

  it("list --search filters meetings by title keyword", () => {
    // First get a meeting to extract a keyword from its title
    const listResult = run("list --limit 1");
    const meetings = JSON.parse(listResult);
    if (meetings.length === 0 || !meetings[0].title) return;

    // Use the first word of the title as search term
    const keyword = meetings[0].title.split(/\s+/)[0];
    if (!keyword) return;

    const result = run(`list --limit 20 --search "${keyword}"`);
    const filtered = JSON.parse(result);
    expect(Array.isArray(filtered)).toBe(true);
    for (const m of filtered) {
      expect(m.title.toLowerCase()).toContain(keyword.toLowerCase());
    }
  }, TEST_TIMEOUT);
});

describe.runIf(hasApiKey)("e2e: show", () => {
  let meetingId: string;

  beforeAll(() => {
    const listResult = run("list --limit 1");
    const meetings = JSON.parse(listResult);
    expect(meetings.length).toBeGreaterThan(0);
    meetingId = meetings[0].id;
  }, TEST_TIMEOUT);

  it("show <id> returns meeting detail without transcript by default", () => {
    const result = run(`show ${meetingId}`);
    const transcript = JSON.parse(result);
    expect(transcript).toHaveProperty("id", meetingId);
    expect(transcript).toHaveProperty("title");
    expect(transcript).toHaveProperty("summary");
    expect(transcript).not.toHaveProperty("sentences");
  }, TEST_TIMEOUT);

  it("show <id> --include-transcript includes transcript", () => {
    const result = run(`show ${meetingId} --include-transcript`);
    const transcript = JSON.parse(result);
    expect(transcript).toHaveProperty("id", meetingId);
    expect(transcript).toHaveProperty("summary");
    expect(transcript).toHaveProperty("sentences");
  }, TEST_TIMEOUT);

  it("show <id> --md returns markdown with frontmatter and sections", () => {
    const result = run(`show ${meetingId} --md`);
    expect(result).toMatch(/^---\n/);
    expect(result).toContain("source: fireflies");
    expect(result).toContain("---\n");
    expect(result).toContain("# ");
    expect(result).toContain("**Date:**");
  }, TEST_TIMEOUT);

  it("show <id> --summary-only excludes transcript section", () => {
    const result = run(`show ${meetingId} --summary-only`);
    const transcript = JSON.parse(result);
    expect(transcript).toHaveProperty("summary");
    expect(transcript).not.toHaveProperty("sentences");
  }, TEST_TIMEOUT);

  it("show <id> --transcript-only excludes summary", () => {
    const result = run(`show ${meetingId} --transcript-only`);
    const transcript = JSON.parse(result);
    expect(transcript).not.toHaveProperty("summary");
    expect(transcript).toHaveProperty("sentences");
  }, TEST_TIMEOUT);

  it("show <id> --summary-only --md returns markdown without transcript section", () => {
    const result = run(`show ${meetingId} --summary-only --md`);
    expect(result).toMatch(/^---\n/);
    expect(result).toContain("source: fireflies");
    expect(result).not.toContain("## Transcript");
  }, TEST_TIMEOUT);

  it("show <id> --transcript-only --md returns markdown without summary sections", () => {
    const result = run(`show ${meetingId} --transcript-only --md`);
    expect(result).toMatch(/^---\n/);
    expect(result).not.toContain("## Overview");
    expect(result).not.toContain("## Action Items");
    expect(result).toContain("## Transcript");
  }, TEST_TIMEOUT);
});
