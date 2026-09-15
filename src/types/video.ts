import type { UserSummary } from "@/types/user";

export interface VideoRoomSummary {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  endedAt: string | null;
  participants: VideoParticipantSummary[];
}

export interface VideoParticipantSummary {
  user: UserSummary;
  joinedAt: string;
  leftAt: string | null;
}

export type VideoSignalKind = "offer" | "answer" | "ice-candidate";

export interface VideoSignal {
  kind: VideoSignalKind;
  fromUserId: string;
  toUserId: string;
  payload: unknown;
}
