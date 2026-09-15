import "server-only";
import { getOctokit, withGitHubErrorHandling } from "./client";
import type { GitHubIssueSummary } from "@/types/github";

interface RawGitHubIssue {
  number: number;
  title: string;
  body?: string | null;
  state: string;
  labels: (string | { name?: string; color?: string | null })[];
  assignees?: { login: string; avatar_url: string }[] | null;
  user?: { login: string; avatar_url: string } | null;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
}

function normalizeIssue(issue: RawGitHubIssue): GitHubIssueSummary {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body ?? null,
    state: issue.state === "closed" ? "closed" : "open",
    labels: issue.labels.map((l) =>
      typeof l === "string" ? { name: l, color: "888888" } : { name: l.name ?? "", color: l.color ?? "888888" },
    ),
    assignees: (issue.assignees ?? []).map((a) => ({ login: a.login, avatarUrl: a.avatar_url })),
    author: issue.user ? { login: issue.user.login, avatarUrl: issue.user.avatar_url } : null,
    comments: issue.comments,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at,
    htmlUrl: issue.html_url,
  };
}

export async function listIssues(
  userId: string,
  owner: string,
  repo: string,
  opts: { state?: "open" | "closed" | "all"; page?: number; perPage?: number } = {},
): Promise<GitHubIssueSummary[]> {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.issues.listForRepo({
      owner,
      repo,
      state: opts.state ?? "all",
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 50,
    });
    // GitHub's issues endpoint also returns PRs; filter those out.
    return res.data.filter((i) => !("pull_request" in i)).map(normalizeIssue);
  });
}

export async function getIssue(userId: string, owner: string, repo: string, number: number) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.issues.get({ owner, repo, issue_number: number });
    return normalizeIssue(res.data);
  });
}

export async function createIssue(
  userId: string,
  owner: string,
  repo: string,
  opts: { title: string; body?: string; labels?: string[]; assignees?: string[] },
) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.issues.create({ owner, repo, ...opts });
    return normalizeIssue(res.data);
  });
}

export async function updateIssue(
  userId: string,
  owner: string,
  repo: string,
  number: number,
  opts: { title?: string; body?: string; state?: "open" | "closed"; labels?: string[]; assignees?: string[] },
) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.issues.update({ owner, repo, issue_number: number, ...opts });
    return normalizeIssue(res.data);
  });
}

export async function addIssueComment(
  userId: string,
  owner: string,
  repo: string,
  number: number,
  body: string,
) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.issues.createComment({ owner, repo, issue_number: number, body });
    return res.data;
  });
}

export async function listIssueComments(userId: string, owner: string, repo: string, number: number) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.issues.listComments({ owner, repo, issue_number: number, per_page: 100 });
    return res.data.map((c) => ({
      id: c.id,
      body: c.body ?? "",
      author: c.user ? { login: c.user.login, avatarUrl: c.user.avatar_url } : null,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  });
}
