import { describe, it, expect } from "vitest";
import { AuthError } from "@/lib/auth/session";
import { MessageNotFoundError } from "@/lib/messages/service";
import { toToolErrorResult } from "@/server/mcp/errors";

function text(result: ReturnType<typeof toToolErrorResult>): string {
  const [first] = result.content as { type: "text"; text: string }[];
  return first.text;
}

describe("toToolErrorResult", () => {
  it("marks every result as an error", () => {
    expect(toToolErrorResult(new Error("boom")).isError).toBe(true);
  });

  it("describes an unauthenticated AuthError without leaking internals", () => {
    const result = toToolErrorResult(new AuthError("UNAUTHENTICATED", "no session"));
    expect(text(result)).toBe("Unauthenticated: you must be signed in to use this tool.");
  });

  it("surfaces a forbidden AuthError's message", () => {
    const result = toToolErrorResult(new AuthError("FORBIDDEN", "You do not have access to this channel."));
    expect(text(result)).toBe("Forbidden: You do not have access to this channel.");
  });

  it("surfaces a not-found error's message", () => {
    const result = toToolErrorResult(new MessageNotFoundError("msg_404"));
    expect(text(result)).toContain("Not found");
    expect(text(result)).toContain("msg_404");
  });

  it("collapses unknown errors to a generic message, never exposing the stack", () => {
    const result = toToolErrorResult(new Error("DATABASE_URL=postgres://secret leaked"));
    expect(text(result)).toBe("Internal error: the request could not be completed.");
    expect(text(result)).not.toContain("secret");
  });

  it("collapses non-Error throwables to the same generic message", () => {
    const result = toToolErrorResult("some string throw");
    expect(text(result)).toBe("Internal error: the request could not be completed.");
  });
});
