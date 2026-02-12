import { GraphQLClient, type Variables } from "graphql-request";
import { resolveApiKey } from "../config/config.ts";

const ENDPOINT = "https://api.fireflies.ai/graphql";
const MAX_RETRIES = 3;

export class FirefliesApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "FirefliesApiError";
  }
}

function getClient(): GraphQLClient {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new FirefliesApiError(
      "no_api_key",
      "No API key found. Run `ffcli auth` or set FIREFLIES_API_KEY.",
    );
  }
  return new GraphQLClient(ENDPOINT, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

function mapErrorCode(error: unknown): FirefliesApiError {
  if (error instanceof FirefliesApiError) return error;

  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
    return new FirefliesApiError(
      "network_error",
      "Could not connect to Fireflies API. Check your internet connection.",
    );
  }

  // Try to extract GraphQL error codes
  if (typeof error === "object" && error !== null && "response" in error) {
    const resp = error as { response: { errors?: { message: string }[] } };
    const gqlError = resp.response?.errors?.[0]?.message ?? "";

    if (gqlError.includes("auth_failed") || gqlError.includes("Unauthorized")) {
      return new FirefliesApiError(
        "auth_failed",
        "Invalid API key. Run `ffcli auth` to reconfigure.",
      );
    }
    if (gqlError.includes("too_many_requests")) {
      return new FirefliesApiError("too_many_requests", "Rate limited. Try again later.");
    }
    if (gqlError.includes("object_not_found") || gqlError.includes("not found")) {
      return new FirefliesApiError(
        "object_not_found",
        "Meeting not found. Check the ID with `ffcli list`.",
      );
    }
    if (gqlError.includes("paid_required")) {
      return new FirefliesApiError(
        "paid_required",
        "This feature requires a paid Fireflies plan.",
      );
    }
    if (gqlError.includes("forbidden")) {
      return new FirefliesApiError(
        "forbidden",
        "You don't have permission to access this resource.",
      );
    }
    if (gqlError.includes("not_in_team")) {
      return new FirefliesApiError("not_in_team", "That user is not in your team.");
    }
    if (gqlError.includes("require_elevated_privilege")) {
      return new FirefliesApiError(
        "require_elevated_privilege",
        "This action requires admin privileges.",
      );
    }
  }

  return new FirefliesApiError("unknown", msg);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function query<T>(document: string, variables?: Variables): Promise<T> {
  const client = getClient();
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await client.request<T>(document, variables);
    } catch (error) {
      const mapped = mapErrorCode(error);
      if (mapped.code === "too_many_requests" && attempt < MAX_RETRIES - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
        lastError = error;
        continue;
      }
      throw mapped;
    }
  }

  throw mapErrorCode(lastError);
}
