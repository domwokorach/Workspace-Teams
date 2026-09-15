import "server-only";
import { getOctokit, withGitHubErrorHandling } from "./client";
import type { GitHubContributorSummary } from "@/types/github";

export async function listContributors(
  userId: string,
  owner: string,
  repo: string,
): Promise<GitHubContributorSummary[]> {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const [contributorsRes, statsRes] = await Promise.all([
      octokit.repos.listContributors({ owner, repo, per_page: 100 }),
      octokit.repos.getContributorsStats({ owner, repo }).catch(() => ({ data: [] })),
    ]);

    const statsByLogin = new Map(
      (Array.isArray(statsRes.data) ? statsRes.data : []).map((s) => [
        s.author?.login,
        s.weeks.reduce(
          (acc, w) => ({
            additions: acc.additions + (w.a ?? 0),
            deletions: acc.deletions + (w.d ?? 0),
          }),
          { additions: 0, deletions: 0 },
        ),
      ]),
    );

    return contributorsRes.data
      .filter((c): c is typeof c & { login: string; avatar_url: string; html_url: string } => !!c.login)
      .map((c) => {
        const stats = statsByLogin.get(c.login);
        return {
          login: c.login,
          avatarUrl: c.avatar_url,
          htmlUrl: c.html_url,
          commits: c.contributions,
          additions: stats?.additions ?? 0,
          deletions: stats?.deletions ?? 0,
        };
      })
      .sort((a, b) => b.commits - a.commits);
  });
}

/** Weekly commit-activity series for a simple "commits over time" chart. */
export async function getCommitActivity(userId: string, owner: string, repo: string) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.repos.getCommitActivityStats({ owner, repo });
    const weeks = Array.isArray(res.data) ? res.data : [];
    return weeks.map((w) => ({ weekStart: new Date(w.week * 1000).toISOString(), total: w.total }));
  });
}
