import { z } from "zod";

/**
 * Shared validation for the Messages domain — used by both the MCP Messages
 * tools (src/server/mcp/tools/messages.ts) and the messages service layer
 * (src/lib/messages/service.ts) so every entry point enforces the same rules.
 */

const id = z.string().trim().min(1, "id is required");
const content = z.string().trim().min(1, "content is required").max(4000, "content must be 4000 characters or fewer");
const limit = z.number().int().min(1).max(100).optional().default(20);
const cursor = z.string().trim().min(1).optional();
const isoDate = z.string().trim().refine((v) => !Number.isNaN(Date.parse(v)), "must be an ISO 8601 date string");

export const listMessagesShape = {
  channelId: id.describe("Channel to list messages from."),
  limit: limit.describe("Max messages to return (1-100, default 20)."),
  cursor: cursor.describe("Opaque cursor from a previous page's nextCursor."),
};
export const listMessagesSchema = z.object(listMessagesShape);
export type ListMessagesInput = z.infer<typeof listMessagesSchema>;

export const getMessageShape = {
  messageId: id.describe("Message id to fetch."),
};
export const getMessageSchema = z.object(getMessageShape);
export type GetMessageInput = z.infer<typeof getMessageSchema>;

export const createMessageShape = {
  channelId: id.describe("Channel to send the message to."),
  content: content.describe("Message body (plain text)."),
  threadId: id.optional().describe("Optional thread to reply within."),
};
export const createMessageSchema = z.object(createMessageShape);
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export const updateMessageShape = {
  messageId: id.describe("Message id to edit."),
  content: content.describe("New message body."),
};
export const updateMessageSchema = z.object(updateMessageShape);
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;

export const deleteMessageShape = {
  messageId: id.describe("Message id to delete."),
};
export const deleteMessageSchema = z.object(deleteMessageShape);
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;

export const searchMessagesShape = {
  channelId: id.optional().describe("Restrict the search to one channel. Omit to search every channel the caller is a member of."),
  senderId: id.optional().describe("Restrict to messages authored by this user id."),
  query: z.string().trim().min(1).max(200).optional().describe("Case-insensitive text to search for in message content."),
  read: z.boolean().optional().describe("Filter by whether the caller has read the message."),
  createdAfter: isoDate.optional().describe("Only messages created at or after this ISO date."),
  createdBefore: isoDate.optional().describe("Only messages created at or before this ISO date."),
  limit,
  cursor,
};
export const searchMessagesSchema = z.object(searchMessagesShape);
export type SearchMessagesInput = z.infer<typeof searchMessagesSchema>;

export const markReadShape = {
  channelId: id.describe("Channel to update the read cursor for."),
  upToMessageId: id.optional().describe("Mark read up through this message. Omit to mark the whole channel read as of now."),
};
export const markReadSchema = z.object(markReadShape);
export type MarkReadInput = z.infer<typeof markReadSchema>;

/**
 * Output schemas — describe the structured content each MCP Messages tool
 * returns, mirroring MessageDTO/PagedResult from src/lib/messages/types.ts.
 */

const messageAuthorShape = {
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
};

const messageChannelShape = {
  id: z.string(),
  name: z.string(),
  workspaceId: z.string(),
};

const messageShape = {
  id: z.string(),
  channel: z.object(messageChannelShape),
  sender: z.object(messageAuthorShape),
  recipient: z.object({ type: z.literal("channel"), id: z.string(), name: z.string() }),
  subject: z.string().nullable(),
  content: z.string(),
  status: z.enum(["sent", "edited"]),
  read: z.boolean(),
  threadId: z.string().nullable(),
  reactionCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
};
export const messageSchema = z.object(messageShape);

export const messageOutputShape = { message: messageSchema };
export const pagedMessagesOutputShape = { items: z.array(messageSchema), nextCursor: z.string().nullable() };
export const deleteMessageOutputShape = { id: z.string(), channelId: z.string() };
export const markReadOutputShape = { channelId: z.string(), lastReadAt: z.string() };
