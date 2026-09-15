import "server-only";
import { getOctokit, withGitHubErrorHandling } from "./client";
import type {
  GitHubRepoSummary,
  GitHubBranchSummary,
  GitHubCommitSummary,
  GitHubFileEntry,
} from "@/types/github";

interface RawGitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string } | null;
  description?: string | null;
  private: boolean;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  updated_at?: string | null;
  default_branch?: string;
  html_url: string;
  clone_url?: string | null;
  ssh_url?: string;
}

function normalizeRepo(repo: RawGitHubRepo): GitHubRepoSummary {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner?.login ?? "unknown",
    ownerAvatarUrl: repo.owner?.avatar_url ?? "",
    description: repo.description ?? null,
    isPrivate: repo.private,
    language: repo.language ?? null,
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    openIssues: repo.open_issues_count ?? 0,
    updatedAt: repo.updated_at ?? new Date().toISOString(),
    defaultBranch: repo.default_branch ?? "main",
    htmlUrl: repo.html_url,
    cloneUrlHttps: repo.clone_url ?? "",
    cloneUrlSsh: repo.ssh_url ?? "",
  };
}

export interface SearchReposOptions {
  query?: string;
  owner?: string;
  language?: string;
  visibility?: "public" | "private" | "all";
  sort?: "updated" | "stars" | "forks";
  page?: number;
  perPage?: number;
}

/** Lists repositories the authenticated user has access to, with client-side-ish filtering via the search API when a query is present. */
export async function searchUserRepositories(userId: string, opts: SearchReposOptions = {}) {
  const octokit = await getOctokit(userId);
  const { query, owner, language, visibility = "all", sort = "updated", page = 1, perPage = 20 } = opts;

  return withGitHubErrorHandling(async () => {
    if (query || owner || language) {
      const qualifiers: string[] = [];
      if (owner) qualifiers.push(`user:${owner}`);
      if (language) qualifiers.push(`language:${language}`);
      if (visibility !== "all") qualifiers.push(`is:${visibility}`);
      const q = [query, ...qualifiers].filter(Boolean).join(" ") || "fork:true user:@me";

      const res = await octokit.search.repos({
        q,
        sort: sort === "updated" ? "updated" : sort,
        order: "desc",
        page,
        per_page: perPage,
      });

      return {
        repos: res.data.items.map(normalizeRepo),
        total: res.data.total_count,
      };
    }

    const res = await octokit.repos.listForAuthenticatedUser({
      visibility,
      sort: sort === "updated" ? "updated" : "full_name",
      direction: "desc",
      page,
      per_page: perPage,
    });

    return { repos: res.data.map(normalizeRepo), total: res.data.length };
  });
}

export async function getRepository(userId: string, owner: string, repo: string) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.repos.get({ owner, repo });
    return normalizeRepo(res.data);
  });
}

export async function listBranches(userId: string, owner: string, repo: string): Promise<GitHubBranchSummary[]> {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const [branchesRes, repoRes] = await Promise.all([
      octokit.repos.listBranches({ owner, repo, per_page: 100 }),
      octokit.repos.get({ owner, repo }),
    ]);
    return branchesRes.data.map((b) => ({
      name: b.name,
      isDefault: b.name === repoRes.data.default_branch,
      headSha: b.commit.sha,
      protected: b.protected,
    }));
  });
}

export async function listCommits(
  userId: string,
  owner: string,
  repo: string,
  opts: { branch?: string; page?: number; perPage?: number } = {},
): Promise<GitHubCommitSummary[]> {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.repos.listCommits({
      owner,
      repo,
      sha: opts.branch,
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 30,
    });
    return res.data.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      authorName: c.commit.author?.name ?? "Unknown",
      authorEmail: c.commit.author?.email ?? "",
      authorAvatarUrl: c.author?.avatar_url ?? null,
      committedAt: c.commit.author?.date ?? new Date().toISOString(),
      htmlUrl: c.html_url,
    }));
  });
}

export async function listFiles(
  userId: string,
  owner: string,
  repo: string,
  path = "",
  ref?: string,
): Promise<GitHubFileEntry[]> {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.repos.getContent({ owner, repo, path, ref });
    const entries = Array.isArray(res.data) ? res.data : [res.data];
    return entries
      .map((e) => ({
        path: e.path,
        name: e.name,
        type: e.type === "dir" ? ("dir" as const) : ("file" as const),
        size: "size" in e ? e.size : 0,
        sha: e.sha,
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  });
}

export async function getFileContent(
  userId: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<{ content: string; sha: string }> {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.repos.getContent({ owner, repo, path, ref });
    if (Array.isArray(res.data) || res.data.type !== "file") {
      throw new Error(`${path} is not a file`);
    }
    return {
      content: Buffer.from(res.data.content, "base64").toString("utf-8"),
      sha: res.data.sha,
    };
  });
}

/**
 * Creates or updates a file via the Contents API — this is how commits are made
 * server-side without ever cloning the repo or exposing tokens to the browser.
 */
export async function createBranch(
  userId: string,
  owner: string,
  repo: string,
  opts: { name: string; fromBranch: string },
) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const base = await octokit.repos.getBranch({ owner, repo, branch: opts.fromBranch });
    const res = await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${opts.name}`,
      sha: base.data.commit.sha,
    });
    return res.data;
  });
}

export async function commitFile(
  userId: string,
  owner: string,
  repo: string,
  opts: { path: string; content: string; message: string; branch: string; sha?: string },
) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: opts.path,
      message: opts.message,
      content: Buffer.from(opts.content, "utf-8").toString("base64"),
      branch: opts.branch,
      sha: opts.sha,
    });
    return res.data;
  });
}
