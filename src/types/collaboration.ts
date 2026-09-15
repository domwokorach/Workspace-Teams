import type { UserSummary } from "@/types/user";

export interface CodingSessionSummary {
  id: string;
  repositoryId: string;
  filePath: string;
  createdAt: string;
  endedAt: string | null;
  participants: CodingSessionParticipantSummary[];
}

export interface CodingSessionParticipantSummary {
  user: UserSummary;
  joinedAt: string;
  leftAt: string | null;
}

export interface CursorPosition {
  userId: string;
  filePath: string;
  line: number;
  column: number;
}
