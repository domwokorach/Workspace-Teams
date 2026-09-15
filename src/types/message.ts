import type { ChannelKind } from "@/generated/prisma/enums";
import type { UserSummary } from "@/types/user";

export interface ChannelSummary {
  id: string;
  workspaceId: string;
  name: string;
  topic: string | null;
  kind: ChannelKind;
  unreadCount: number;
}

export interface MessageSummary {
  id: string;
  channelId: string;
  content: string;
  author: UserSummary;
  threadId: string | null;
  editedAt: string | null;
  createdAt: string;
  reactions: MessageReactionSummary[];
}

export interface MessageReactionSummary {
  emoji: string;
  userIds: string[];
}
