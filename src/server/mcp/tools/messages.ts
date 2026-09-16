import "server-only";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AuthError, type CurrentUser } from "@/lib/auth/session";
import {
  listMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
  searchMessages,
  markRead,
} from "@/lib/messages/service";
import {
  listMessagesShape,
  getMessageShape,
  createMessageShape,
  updateMessageShape,
  deleteMessageShape,
  searchMessagesShape,
  markReadShape,
  messageOutputShape,
  pagedMessagesOutputShape,
  deleteMessageOutputShape,
  markReadOutputShape,
  type ListMessagesInput,
  type GetMessageInput,
  type CreateMessageInput,
  type UpdateMessageInput,
  type DeleteMessageInput,
  type SearchMessagesInput,
  type MarkReadInput,
} from "@/lib/validation/messages";
import { toToolErrorResult } from "../errors";

/**
 * MCP Messages tools. The caller's session is resolved once, up front, by
 * the HTTP transport route (src/app/api/mcp/route.ts) — via
 * `next/headers` cookies() — and passed in here rather than re-read inside
 * each tool handler: the MCP SDK processes tool calls through its own
 * internal stream/dispatch loop, which does not preserve Next's per-request
 * AsyncLocalStorage context, so calling `cookies()` from inside a handler
 * fails with "cookies was called outside a request scope".
 *
 * Every handler still delegates all business logic and authorization to
 * src/lib/messages/service.ts, and converts errors into MCP-compatible
 * tool error results instead of throwing internals back to the client.
 */

function requireUser(user: CurrentUser | null): CurrentUser {
  if (!user) throw new AuthError("UNAUTHENTICATED", "You must be signed in to use this tool.");
  return user;
}

function jsonResult(structuredContent: Record<string, unknown>): CallToolResult {
  return { structuredContent, content: [{ type: "text", text: JSON.stringify(structuredContent) }] };
}

export async function messagesListTool(user: CurrentUser | null, input: ListMessagesInput): Promise<CallToolResult> {
  try {
    const caller = requireUser(user);
    const result = await listMessages(caller.id, input);
    return jsonResult({ items: result.items, nextCursor: result.nextCursor });
  } catch (error) {
    return toToolErrorResult(error);
  }
}

export async function messagesGetTool(user: CurrentUser | null, input: GetMessageInput): Promise<CallToolResult> {
  try {
    const caller = requireUser(user);
    const message = await getMessage(caller.id, input.messageId);
    return jsonResult({ message });
  } catch (error) {
    return toToolErrorResult(error);
  }
}

export async function messagesCreateTool(user: CurrentUser | null, input: CreateMessageInput): Promise<CallToolResult> {
  try {
    const caller = requireUser(user);
    const message = await createMessage(caller.id, input);
    return jsonResult({ message });
  } catch (error) {
    return toToolErrorResult(error);
  }
}

export async function messagesUpdateTool(user: CurrentUser | null, input: UpdateMessageInput): Promise<CallToolResult> {
  try {
    const caller = requireUser(user);
    const message = await updateMessage(caller.id, input);
    return jsonResult({ message });
  } catch (error) {
    return toToolErrorResult(error);
  }
}

export async function messagesDeleteTool(user: CurrentUser | null, input: DeleteMessageInput): Promise<CallToolResult> {
  try {
    const caller = requireUser(user);
    const result = await deleteMessage(caller.id, input.messageId);
    return jsonResult(result);
  } catch (error) {
    return toToolErrorResult(error);
  }
}

export async function messagesSearchTool(user: CurrentUser | null, input: SearchMessagesInput): Promise<CallToolResult> {
  try {
    const caller = requireUser(user);
    const result = await searchMessages(caller.id, input);
    return jsonResult({ items: result.items, nextCursor: result.nextCursor });
  } catch (error) {
    return toToolErrorResult(error);
  }
}

export async function messagesMarkReadTool(user: CurrentUser | null, input: MarkReadInput): Promise<CallToolResult> {
  try {
    const caller = requireUser(user);
    const result = await markRead(caller.id, input);
    return jsonResult(result);
  } catch (error) {
    return toToolErrorResult(error);
  }
}

export function registerMessagesTools(server: McpServer, user: CurrentUser | null): void {
  server.registerTool(
    "messages_list",
    {
      title: "List messages",
      description: "List messages in a channel, newest first, with cursor-based pagination.",
      inputSchema: listMessagesShape,
      outputSchema: pagedMessagesOutputShape,
    },
    (args) => messagesListTool(user, args),
  );

  server.registerTool(
    "messages_get",
    {
      title: "Get message",
      description: "Get a single message by id. The caller must have access to its channel.",
      inputSchema: getMessageShape,
      outputSchema: messageOutputShape,
    },
    (args) => messagesGetTool(user, args),
  );

  server.registerTool(
    "messages_create",
    {
      title: "Create message",
      description: "Send a new message to a channel the caller is a member of.",
      inputSchema: createMessageShape,
      outputSchema: messageOutputShape,
    },
    (args) => messagesCreateTool(user, args),
  );

  server.registerTool(
    "messages_update",
    {
      title: "Update message",
      description: "Edit the content of a message the caller authored.",
      inputSchema: updateMessageShape,
      outputSchema: messageOutputShape,
    },
    (args) => messagesUpdateTool(user, args),
  );

  server.registerTool(
    "messages_delete",
    {
      title: "Delete message",
      description: "Delete a message the caller authored.",
      inputSchema: deleteMessageShape,
      outputSchema: deleteMessageOutputShape,
    },
    (args) => messagesDeleteTool(user, args),
  );

  server.registerTool(
    "messages_search",
    {
      title: "Search messages",
      description:
        "Search and filter messages by sender, text content, read status, and date range across every channel the caller is a member of (or one channel, if given).",
      inputSchema: searchMessagesShape,
      outputSchema: pagedMessagesOutputShape,
    },
    (args) => messagesSearchTool(user, args),
  );

  server.registerTool(
    "messages_mark_read",
    {
      title: "Mark messages read",
      description: "Mark a channel's messages as read, either as of now or up through a specific message.",
      inputSchema: markReadShape,
      outputSchema: markReadOutputShape,
    },
    (args) => messagesMarkReadTool(user, args),
  );
}
