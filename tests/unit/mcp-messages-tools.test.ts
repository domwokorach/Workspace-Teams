import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

vi.mock("@/lib/messages/service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/messages/service")>("@/lib/messages/service");
  return {
    ...actual,
    listMessages: vi.fn(),
    getMessage: vi.fn(),
    createMessage: vi.fn(),
    updateMessage: vi.fn(),
    deleteMessage: vi.fn(),
    searchMessages: vi.fn(),
    markRead: vi.fn(),
  };
});

import { AuthError, type CurrentUser } from "@/lib/auth/session";
import * as service from "@/lib/messages/service";
import { MessageNotFoundError } from "@/lib/messages/service";
import {
  messagesListTool,
  messagesGetTool,
  messagesCreateTool,
  messagesUpdateTool,
  messagesDeleteTool,
  messagesSearchTool,
  messagesMarkReadTool,
} from "@/server/mcp/tools/messages";

const CALLER: CurrentUser = {
  id: "user_1",
  email: "a@example.com",
  firstName: "A",
  lastName: "B",
  role: "MEMBER",
  avatarUrl: null,
  githubUsername: null,
  status: "ACTIVE",
  timezone: "UTC",
};

const MESSAGE = {
  id: "msg_1",
  channel: { id: "chan_1", name: "general", workspaceId: "ws_1" },
  sender: { id: "user_1", name: "A B", email: "a@example.com", avatarUrl: null },
  recipient: { type: "channel" as const, id: "chan_1", name: "general" },
  subject: null,
  content: "hello",
  status: "sent" as const,
  read: true,
  threadId: null,
  reactionCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function structured(result: CallToolResult) {
  return result.structuredContent as Record<string, unknown>;
}

function firstText(result: CallToolResult): string {
  return (result.content as { type: "text"; text: string }[])[0].text;
}

beforeEach(() => {
  vi.mocked(service.listMessages).mockReset();
  vi.mocked(service.getMessage).mockReset();
  vi.mocked(service.createMessage).mockReset();
  vi.mocked(service.updateMessage).mockReset();
  vi.mocked(service.deleteMessage).mockReset();
  vi.mocked(service.searchMessages).mockReset();
  vi.mocked(service.markRead).mockReset();
});

describe("unauthenticated access", () => {
  it("rejects every tool without leaking why, when there is no session", async () => {
    const result = await messagesListTool(null, { channelId: "chan_1", limit: 20 });
    expect(result.isError).toBe(true);
    expect(firstText(result)).toContain("Unauthenticated");
    expect(service.listMessages).not.toHaveBeenCalled();
  });

  it("rejects messages_create with no session", async () => {
    const result = await messagesCreateTool(null, { channelId: "chan_1", content: "hi" });
    expect(result.isError).toBe(true);
    expect(firstText(result)).toContain("Unauthenticated");
    expect(service.createMessage).not.toHaveBeenCalled();
  });
});

describe("messages_list", () => {
  it("returns an empty page when the channel has no messages", async () => {
    vi.mocked(service.listMessages).mockResolvedValue({ items: [], nextCursor: null });

    const result = await messagesListTool(CALLER, { channelId: "chan_1", limit: 20 });
    expect(structured(result)).toEqual({ items: [], nextCursor: null });
  });

  it("passes the cursor and limit through to the service for pagination", async () => {
    vi.mocked(service.listMessages).mockResolvedValue({ items: [MESSAGE], nextCursor: "msg_2" });

    const result = await messagesListTool(CALLER, { channelId: "chan_1", limit: 1, cursor: "msg_0" });
    expect(service.listMessages).toHaveBeenCalledWith("user_1", { channelId: "chan_1", limit: 1, cursor: "msg_0" });
    expect(structured(result).nextCursor).toBe("msg_2");
  });

  it("surfaces forbidden access to a channel the caller cannot see", async () => {
    vi.mocked(service.listMessages).mockRejectedValue(new AuthError("FORBIDDEN", "You do not have access to this channel."));

    const result = await messagesListTool(CALLER, { channelId: "chan_other", limit: 20 });
    expect(result.isError).toBe(true);
    expect(firstText(result)).toContain("Forbidden");
  });
});

describe("messages_get", () => {
  it("returns the message wrapped in a message field", async () => {
    vi.mocked(service.getMessage).mockResolvedValue(MESSAGE);

    const result = await messagesGetTool(CALLER, { messageId: "msg_1" });
    expect(structured(result)).toEqual({ message: MESSAGE });
  });

  it("returns a not-found tool error for an invalid id", async () => {
    vi.mocked(service.getMessage).mockRejectedValue(new MessageNotFoundError("does-not-exist"));

    const result = await messagesGetTool(CALLER, { messageId: "does-not-exist" });
    expect(result.isError).toBe(true);
    expect(firstText(result)).toContain("Not found");
  });
});

describe("messages_create", () => {
  it("creates a message for the authenticated caller", async () => {
    vi.mocked(service.createMessage).mockResolvedValue(MESSAGE);

    const result = await messagesCreateTool(CALLER, { channelId: "chan_1", content: "hello" });
    expect(service.createMessage).toHaveBeenCalledWith("user_1", { channelId: "chan_1", content: "hello" });
    expect(structured(result)).toEqual({ message: MESSAGE });
  });
});

describe("messages_update", () => {
  it("rejects editing a message the caller does not own", async () => {
    vi.mocked(service.updateMessage).mockRejectedValue(new AuthError("FORBIDDEN", "You can only edit your own messages."));

    const result = await messagesUpdateTool(CALLER, { messageId: "msg_1", content: "edited" });
    expect(result.isError).toBe(true);
    expect(firstText(result)).toContain("You can only edit your own messages.");
  });
});

describe("messages_delete", () => {
  it("returns the deleted message's id and channel", async () => {
    vi.mocked(service.deleteMessage).mockResolvedValue({ id: "msg_1", channelId: "chan_1" });

    const result = await messagesDeleteTool(CALLER, { messageId: "msg_1" });
    expect(structured(result)).toEqual({ id: "msg_1", channelId: "chan_1" });
  });
});

describe("messages_search", () => {
  it("filters by read status and returns a page", async () => {
    vi.mocked(service.searchMessages).mockResolvedValue({ items: [MESSAGE], nextCursor: null });

    const result = await messagesSearchTool(CALLER, { read: true, limit: 20 });
    expect(service.searchMessages).toHaveBeenCalledWith("user_1", { read: true, limit: 20 });
    expect(structured(result)).toEqual({ items: [MESSAGE], nextCursor: null });
  });

  it("returns an empty page when nothing matches", async () => {
    vi.mocked(service.searchMessages).mockResolvedValue({ items: [], nextCursor: null });

    const result = await messagesSearchTool(CALLER, { query: "no-such-word", limit: 20 });
    expect(structured(result)).toEqual({ items: [], nextCursor: null });
  });
});

describe("messages_mark_read", () => {
  it("marks a channel read and returns the new cursor", async () => {
    vi.mocked(service.markRead).mockResolvedValue({ channelId: "chan_1", lastReadAt: "2026-01-01T00:00:00.000Z" });

    const result = await messagesMarkReadTool(CALLER, { channelId: "chan_1" });
    expect(structured(result)).toEqual({ channelId: "chan_1", lastReadAt: "2026-01-01T00:00:00.000Z" });
  });
});
