export interface GitHubRepoSummary {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  ownerAvatarUrl: string;
  description: string | null;
  isPrivate: boolean;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  updatedAt: string;
  defaultBranch: string;
  htmlUrl: string;
  cloneUrlHttps: string;
  cloneUrlSsh: string;
}

export interface GitHubBranchSummary {
  name: string;
  isDefault: boolean;
  headSha: string;
  protected: boolean;
}

export interface GitHubCommitSummary {
  sha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl: string | null;
  committedAt: string;
  htmlUrl: string;
}

export interface GitHubFileEntry {
  path: string;
  name: string;
  type: "file" | "dir";
  size: number;
  sha: string;
}

export interface GitHubIssueSummary {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: { name: string; color: string }[];
  assignees: { login: string; avatarUrl: string }[];
  author: { login: string; avatarUrl: string } | null;
  comments: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  htmlUrl: string;
}

export interface GitHubPullRequestSummary {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  draft: boolean;
  merged: boolean;
  sourceBranch: string;
  targetBranch: string;
  author: { login: string; avatarUrl: string } | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  reviewers: { login: string; avatarUrl: string }[];
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  htmlUrl: string;
}

export interface GitHubContributorSummary {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  commits: number;
  additions: number;
  deletions: number;
}

export interface GitHubCheckRunSummary {
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
  detailsUrl: string | null;
}
