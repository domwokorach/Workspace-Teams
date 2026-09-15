import "server-only";
import { getOctokit, withGitHubErrorHandling } from "./client";
import type { GitHubPullRequestSummary } from "@/types/github";

function normalizePR(pr: {
  number: number;
  title: string;
  body: string | null;
  state: string;
  draft?: boolean | null;
  merged_at?: string | null;
  head: { ref: string };
  base: { ref: string };
  user: { login: string; avatar_url: string } | null;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  comments?: number;
  requested_reviewers?: { login: string; avatar_url: string }[] | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
}): GitHubPullRequestSummary {
  return {
    number: pr.number,
    title: pr.title,
    body: pr.body,
    state: pr.state === "closed" ? "closed" : "open",
    draft: pr.draft ?? false,
    merged: !!pr.merged_at,
    sourceBranch: pr.head.ref,
    targetBranch: pr.base.ref,
    author: pr.user ? { login: pr.user.login, avatarUrl: pr.user.avatar_url } : null,
    additions: pr.additions ?? 0,
    deletions: pr.deletions ?? 0,
    changedFiles: pr.changed_files ?? 0,
    comments: pr.comments ?? 0,
    reviewers: (pr.requested_reviewers ?? []).map((r) => ({ login: r.login, avatarUrl: r.avatar_url })),
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at ?? null,
    closedAt: pr.closed_at,
    htmlUrl: pr.html_url,
  };
}

export async function listPullRequests(
  userId: string,
  owner: string,
  repo: string,
  opts: { state?: "open" | "closed" | "all"; page?: number; perPage?: number } = {},
): Promise<GitHubPullRequestSummary[]> {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.pulls.list({
      owner,
      repo,
      state: opts.state ?? "all",
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 50,
    });
    return res.data.map(normalizePR);
  });
}

export async function getPullRequest(userId: string, owner: string, repo: string, number: number) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.pulls.get({ owner, repo, pull_number: number });
    return normalizePR(res.data);
  });
}

export async function listPullRequestFiles(userId: string, owner: string, repo: string, number: number) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.pulls.listFiles({ owner, repo, pull_number: number, per_page: 100 });
    return res.data.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
      patch: f.patch ?? null,
    }));
  });
}

export async function listPullRequestCommits(userId: string, owner: string, repo: string, number: number) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.pulls.listCommits({ owner, repo, pull_number: number, per_page: 100 });
    return res.data.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      authorName: c.commit.author?.name ?? "Unknown",
      authorAvatarUrl: c.author?.avatar_url ?? null,
      committedAt: c.commit.author?.date ?? new Date().toISOString(),
    }));
  });
}

export async function listPullRequestReviews(userId: string, owner: string, repo: string, number: number) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.pulls.listReviews({ owner, repo, pull_number: number, per_page: 100 });
    return res.data.map((r) => ({
      id: r.id,
      state: r.state,
      body: r.body,
      reviewer: r.user ? { login: r.user.login, avatarUrl: r.user.avatar_url } : null,
      submittedAt: r.submitted_at,
    }));
  });
}

export async function createReview(
  userId: string,
  owner: string,
  repo: string,
  number: number,
  opts: { event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT"; body?: string },
) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.pulls.createReview({ owner, repo, pull_number: number, ...opts });
    return res.data;
  });
}

export async function mergePullRequest(
  userId: string,
  owner: string,
  repo: string,
  number: number,
  method: "merge" | "squash" | "rebase" = "merge",
) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.pulls.merge({ owner, repo, pull_number: number, merge_method: method });
    return res.data;
  });
}

export async function closePullRequest(userId: string, owner: string, repo: string, number: number) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.pulls.update({ owner, repo, pull_number: number, state: "closed" });
    return normalizePR(res.data);
  });
}
