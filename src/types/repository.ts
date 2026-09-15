export interface RepositorySummary {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  description: string | null;
  isPrivate: boolean;
  language: string | null;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssuesCount: number;
  lastSyncedAt: string | null;
}

export interface BranchSummary {
  id: string;
  name: string;
  isDefault: boolean;
  headSha: string | null;
}

export interface CommitSummary {
  id: string;
  sha: string;
  message: string;
  authorName: string;
  authorAvatar: string | null;
  committedAt: string;
  additions: number;
  deletions: number;
}
