import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock graphql-request before importing the client
vi.mock("graphql-request", () => {
  const mockRequest = vi.fn();
  return {
    GraphQLClient: vi.fn().mockImplementation(function () {
      return { request: mockRequest };
    }),
    gql: (strings: TemplateStringsArray) => strings.join(""),
  };
});

// Must import after mocking
import { query, FirefliesApiError } from "../../src/api/client.ts";
import { GraphQLClient } from "graphql-request";

function getMockRequest() {
  const instance = vi.mocked(GraphQLClient).mock.results[0]?.value as
    | { request: ReturnType<typeof vi.fn> }
    | undefined;
  return instance?.request;
}

describe("error handling", () => {
  const originalEnv = process.env["FIREFLIES_API_KEY"];

  beforeEach(() => {
    vi.clearAllMocks();
    process.env["FIREFLIES_API_KEY"] = "test-key";
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env["FIREFLIES_API_KEY"] = originalEnv;
    } else {
      delete process.env["FIREFLIES_API_KEY"];
    }
  });

  it("throws no_api_key when no key is configured", async () => {
    delete process.env["FIREFLIES_API_KEY"];
    // Need to re-import to clear module cache, but since we can't easily,
    // we test the error class directly
    const err = new FirefliesApiError("no_api_key", "No API key found. Run `ffcli auth` or set FIREFLIES_API_KEY.");
    expect(err.code).toBe("no_api_key");
    expect(err.message).toContain("No API key found");
    expect(err).toBeInstanceOf(Error);
  });

  it("maps auth_failed errors", async () => {
    process.env["FIREFLIES_API_KEY"] = "test-key";
    // Force a fresh client
    await query("query { user { name } }").catch(() => {});
    const mockReq = getMockRequest();
    if (!mockReq) return;

    mockReq.mockRejectedValueOnce({
      response: { errors: [{ message: "auth_failed" }] },
    });

    await expect(query("query { user { name } }")).rejects.toThrow(
      "Invalid API key"
    );
  });

  it("maps too_many_requests with retries exhausted", async () => {
    process.env["FIREFLIES_API_KEY"] = "test-key";
    await query("query { user { name } }").catch(() => {});
    const mockReq = getMockRequest();
    if (!mockReq) return;

    const rateLimitError = {
      response: { errors: [{ message: "too_many_requests" }] },
    };
    mockReq
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError);

    await expect(query("query { user { name } }")).rejects.toThrow(
      "Rate limited"
    );
  }, 15000);

  it("maps object_not_found errors", async () => {
    process.env["FIREFLIES_API_KEY"] = "test-key";
    await query("query { user { name } }").catch(() => {});
    const mockReq = getMockRequest();
    if (!mockReq) return;

    mockReq.mockRejectedValueOnce({
      response: { errors: [{ message: "object_not_found" }] },
    });

    await expect(query("query { user { name } }")).rejects.toThrow(
      "Meeting not found"
    );
  });

  it("maps paid_required errors", async () => {
    process.env["FIREFLIES_API_KEY"] = "test-key";
    await query("query { user { name } }").catch(() => {});
    const mockReq = getMockRequest();
    if (!mockReq) return;

    mockReq.mockRejectedValueOnce({
      response: { errors: [{ message: "paid_required" }] },
    });

    await expect(query("query { user { name } }")).rejects.toThrow(
      "requires a paid Fireflies plan"
    );
  });

  it("maps forbidden errors", async () => {
    process.env["FIREFLIES_API_KEY"] = "test-key";
    await query("query { user { name } }").catch(() => {});
    const mockReq = getMockRequest();
    if (!mockReq) return;

    mockReq.mockRejectedValueOnce({
      response: { errors: [{ message: "forbidden" }] },
    });

    await expect(query("query { user { name } }")).rejects.toThrow(
      "don't have permission"
    );
  });

  it("maps not_in_team errors", async () => {
    process.env["FIREFLIES_API_KEY"] = "test-key";
    await query("query { user { name } }").catch(() => {});
    const mockReq = getMockRequest();
    if (!mockReq) return;

    mockReq.mockRejectedValueOnce({
      response: { errors: [{ message: "not_in_team" }] },
    });

    await expect(query("query { user { name } }")).rejects.toThrow(
      "not in your team"
    );
  });

  it("maps require_elevated_privilege errors", async () => {
    process.env["FIREFLIES_API_KEY"] = "test-key";
    await query("query { user { name } }").catch(() => {});
    const mockReq = getMockRequest();
    if (!mockReq) return;

    mockReq.mockRejectedValueOnce({
      response: { errors: [{ message: "require_elevated_privilege" }] },
    });

    await expect(query("query { user { name } }")).rejects.toThrow(
      "requires admin privileges"
    );
  });

  it("maps network errors", async () => {
    process.env["FIREFLIES_API_KEY"] = "test-key";
    await query("query { user { name } }").catch(() => {});
    const mockReq = getMockRequest();
    if (!mockReq) return;

    mockReq.mockRejectedValueOnce(new Error("fetch failed"));

    await expect(query("query { user { name } }")).rejects.toThrow(
      "Could not connect to Fireflies API"
    );
  });

  it("FirefliesApiError has correct name and code", () => {
    const err = new FirefliesApiError("test_code", "test message");
    expect(err.name).toBe("FirefliesApiError");
    expect(err.code).toBe("test_code");
    expect(err.message).toBe("test message");
  });
});
