import "server-only";
import { prisma } from "@/lib/db/client";
import { syncRepositoryIssues } from "@/lib/github/sync";
import { syncRepositoryPullRequests } from "@/lib/github/sync";

/** Full issue + pull request sync for a single repository, triggered on demand or by a webhook. */
export async function runGithubSync(repositoryId: string, userId: string) {
  const repository = await prisma.repository.findUniqueOrThrow({ where: { id: repositoryId } });
  const [issueCount, pullRequestCount] = await Promise.all([
    syncRepositoryIssues(userId, repository),
    syncRepositoryPullRequests(userId, repository),
  ]);
  await prisma.repository.update({ where: { id: repositoryId }, data: { lastSyncedAt: new Date() } });
  return { issueCount, pullRequestCount };
}
