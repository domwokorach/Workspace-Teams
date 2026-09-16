import "server-only";
import { prisma } from "@/lib/db/client";
import { Prisma } from "@/generated/prisma/client";
import { AuthError } from "@/lib/auth/session";
import { getAccessibleChannel } from "@/lib/channel";
import type { MessageDTO, PagedResult } from "./types";
import type {
  ListMessagesInput,
  CreateMessageInput,
  UpdateMessageInput,
  SearchMessagesInput,
  MarkReadInput,
} from "@/lib/validation/messages";

/**
 * Business logic for the Messages domain — shared by the REST API
 * (src/app/api/channels/[id]/messages/route.ts) and the MCP Messages tools
 * (src/server/mcp/tools/messages.ts) so both entry points stay in sync
 * instead of duplicating authorization or query logic.
 */

export class MessageNotFoundError extends Error {
  constructor(messageId: string) {
    super(`Message ${messageId} was not found.`);
    this.name = "MessageNotFoundError";
  }
}

const MESSAGE_INCLUDE = {
  author: true,
  channel: { select: { id: true, name: true, workspaceId: true } },
  reactions: true,
} satisfies Prisma.MessageInclude;

type MessageWithRelations = Prisma.MessageGetPayload<{ include: typeof MESSAGE_INCLUDE }>;

/** The requesting user's own read cursor for a channel, or null if they have none yet. */
async function getReadCursor(userId: string, channelId: string) {
  const member = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
    select: { lastReadAt: true },
  });
  return member?.lastReadAt ?? null;
}

function toDTO(message: MessageWithRelations, readCursor: Date | null): MessageDTO {
  return {
    id: message.id,
    channel: { id: message.channel.id, name: message.channel.name, workspaceId: message.channel.workspaceId },
    sender: {
      id: message.author.id,
      name: `${message.author.firstName} ${message.author.lastName}`.trim(),
      email: message.author.email,
      avatarUrl: message.author.avatarUrl,
    },
    recipient: { type: "channel", id: message.channel.id, name: message.channel.name },
    subject: null,
    content: message.content,
    status: message.editedAt ? "edited" : "sent",
    read: readCursor !== null && message.createdAt <= readCursor,
    threadId: message.threadId,
    reactionCount: message.reactions.length,
    createdAt: message.createdAt.toISOString(),
    updatedAt: (message.editedAt ?? message.createdAt).toISOString(),
  };
}

/** Loads a message the caller is authorized to see, throwing AuthError/MessageNotFoundError otherwise. */
async function loadAuthorizedMessage(userId: string, messageId: string): Promise<MessageWithRelations> {
  const message = await prisma.message.findUnique({ where: { id: messageId }, include: MESSAGE_INCLUDE });
  if (!message) throw new MessageNotFoundError(messageId);
  await getAccessibleChannel(userId, message.channelId);
  return message;
}

export async function listMessages(userId: string, input: ListMessagesInput): Promise<PagedResult<MessageDTO>> {
  await getAccessibleChannel(userId, input.channelId);
  const readCursor = await getReadCursor(userId, input.channelId);

  const rows = await prisma.message.findMany({
    where: { channelId: input.channelId },
    include: MESSAGE_INCLUDE,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  return {
    items: page.map((m) => toDTO(m, readCursor)),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function getMessage(userId: string, messageId: string): Promise<MessageDTO> {
  const message = await loadAuthorizedMessage(userId, messageId);
  const readCursor = await getReadCursor(userId, message.channelId);
  return toDTO(message, readCursor);
}

export async function createMessage(userId: string, input: CreateMessageInput): Promise<MessageDTO> {
  await getAccessibleChannel(userId, input.channelId);

  if (input.threadId) {
    const thread = await prisma.messageThread.findUnique({ where: { id: input.threadId } });
    if (!thread || thread.channelId !== input.channelId) {
      throw new AuthError("FORBIDDEN", "That thread does not belong to this channel.");
    }
  }

  const message = await prisma.message.create({
    data: { channelId: input.channelId, authorId: userId, content: input.content, threadId: input.threadId },
    include: MESSAGE_INCLUDE,
  });
  const readCursor = await getReadCursor(userId, input.channelId);
  return toDTO(message, readCursor);
}

export async function updateMessage(userId: string, input: UpdateMessageInput): Promise<MessageDTO> {
  const existing = await loadAuthorizedMessage(userId, input.messageId);
  if (existing.authorId !== userId) {
    throw new AuthError("FORBIDDEN", "You can only edit your own messages.");
  }

  const message = await prisma.message.update({
    where: { id: input.messageId },
    data: { content: input.content, editedAt: new Date() },
    include: MESSAGE_INCLUDE,
  });
  const readCursor = await getReadCursor(userId, message.channelId);
  return toDTO(message, readCursor);
}

export async function deleteMessage(userId: string, messageId: string): Promise<{ id: string; channelId: string }> {
  const existing = await loadAuthorizedMessage(userId, messageId);
  if (existing.authorId !== userId) {
    throw new AuthError("FORBIDDEN", "You can only delete your own messages.");
  }
  await prisma.message.delete({ where: { id: messageId } });
  return { id: messageId, channelId: existing.channelId };
}

export async function searchMessages(userId: string, input: SearchMessagesInput): Promise<PagedResult<MessageDTO>> {
  let channelIds: string[];
  if (input.channelId) {
    await getAccessibleChannel(userId, input.channelId);
    channelIds = [input.channelId];
  } else {
    // Access is granted at the workspace level (see getAccessibleChannel), not
    // via ChannelMember rows, which only track per-channel read cursors — so
    // discover every channel this way too, or workspace members who never
    // got a ChannelMember row would silently see nothing.
    const channels = await prisma.channel.findMany({
      where: { workspace: { members: { some: { userId } } } },
      select: { id: true },
    });
    channelIds = channels.map((c) => c.id);
  }
  if (channelIds.length === 0) return { items: [], nextCursor: null };

  const where: Prisma.MessageWhereInput = {
    channelId: { in: channelIds },
    ...(input.senderId ? { authorId: input.senderId } : {}),
    ...(input.query ? { content: { contains: input.query, mode: "insensitive" } } : {}),
    ...(input.createdAfter || input.createdBefore
      ? {
          createdAt: {
            ...(input.createdAfter ? { gte: new Date(input.createdAfter) } : {}),
            ...(input.createdBefore ? { lte: new Date(input.createdBefore) } : {}),
          },
        }
      : {}),
  };

  const rows = await prisma.message.findMany({
    where,
    include: MESSAGE_INCLUDE,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const readCursors = new Map<string, Date | null>();
  for (const channelId of channelIds) readCursors.set(channelId, await getReadCursor(userId, channelId));

  let dtos = rows.map((m) => toDTO(m, readCursors.get(m.channelId) ?? null));
  if (input.read !== undefined) dtos = dtos.filter((m) => m.read === input.read);

  const hasMore = rows.length > input.limit;
  const page = hasMore ? dtos.slice(0, input.limit) : dtos;
  return { items: page, nextCursor: hasMore ? rows[input.limit - 1]?.id ?? null : null };
}

export async function markRead(userId: string, input: MarkReadInput): Promise<{ channelId: string; lastReadAt: string }> {
  await getAccessibleChannel(userId, input.channelId);

  let lastReadAt = new Date();
  if (input.upToMessageId) {
    const message = await prisma.message.findUnique({ where: { id: input.upToMessageId } });
    if (!message || message.channelId !== input.channelId) {
      throw new AuthError("FORBIDDEN", "That message does not belong to this channel.");
    }
    lastReadAt = message.createdAt;
  }

  await prisma.channelMember.upsert({
    where: { channelId_userId: { channelId: input.channelId, userId } },
    update: { lastReadAt },
    create: { channelId: input.channelId, userId, lastReadAt },
  });

  return { channelId: input.channelId, lastReadAt: lastReadAt.toISOString() };
}
