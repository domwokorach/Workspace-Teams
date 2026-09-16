/**
 * Shared Messages domain types.
 *
 * Note on schema mapping: this app's data model is channel-based chat
 * (Message -> Channel), not a 1:1 inbox (no `subject`, `status`, or
 * per-message `recipient`/`read` column). The DTO below adapts the generic
 * "messages" vocabulary onto what actually exists:
 *  - `recipient` is the channel the message was posted to.
 *  - `subject` is always null (not modeled).
 *  - `status` is derived from `editedAt` ("edited" vs "sent").
 *  - `read` is derived per-caller from `ChannelMember.lastReadAt`.
 */

export interface MessageAuthorDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface MessageChannelDTO {
  id: string;
  name: string;
  workspaceId: string;
}

export interface MessageDTO {
  id: string;
  channel: MessageChannelDTO;
  sender: MessageAuthorDTO;
  recipient: { type: "channel"; id: string; name: string };
  subject: string | null;
  content: string;
  status: "sent" | "edited";
  read: boolean;
  threadId: string | null;
  reactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  nextCursor: string | null;
}
