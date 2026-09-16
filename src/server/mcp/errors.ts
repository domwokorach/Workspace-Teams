import "server-only";
import { AuthError } from "@/lib/auth/session";
import { MessageNotFoundError } from "@/lib/messages/service";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Maps a caught error to a safe MCP tool error result. Only known domain
 * errors (auth, not-found) surface their message; anything else collapses
 * to a generic message so stack traces and internal details never reach
 * the client.
 */
export function toToolErrorResult(error: unknown): CallToolResult {
  return { isError: true, content: [{ type: "text", text: describeError(error) }] };
}

function describeError(error: unknown): string {
  if (error instanceof AuthError) {
    return error.code === "UNAUTHENTICATED"
      ? "Unauthenticated: you must be signed in to use this tool."
      : `Forbidden: ${error.message}`;
  }
  if (error instanceof MessageNotFoundError) {
    return `Not found: ${error.message}`;
  }
  return "Internal error: the request could not be completed.";
}
