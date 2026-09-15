import type { IssueState } from "@/generated/prisma/enums";
import type { UserSummary } from "@/types/user";

export interface IssueSummary {
  id: string;
  repositoryId: string;
  number: number;
  title: string;
  description: string | null;
  state: IssueState;
  labels: string[];
  author: UserSummary | null;
  assignees: UserSummary[];
  commentsCount: number;
  createdAt: string;
  closedAt: string | null;
}
