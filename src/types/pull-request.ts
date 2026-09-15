import type { PullRequestState, ReviewState, TestStatus } from "@/generated/prisma/enums";
import type { UserSummary } from "@/types/user";

export interface PullRequestSummary {
  id: string;
  repositoryId: string;
  number: number;
  title: string;
  description: string | null;
  state: PullRequestState;
  sourceBranch: string;
  targetBranch: string;
  author: UserSummary | null;
  reviewers: UserSummary[];
  additions: number;
  deletions: number;
  changedFiles: number;
  checksStatus: TestStatus;
  createdAt: string;
  mergedAt: string | null;
}

export interface PullRequestReviewSummary {
  id: string;
  reviewer: UserSummary;
  state: ReviewState;
  body: string | null;
  createdAt: string;
}
