import "server-only";
import { prisma } from "@/lib/db/client";

/** Local (non-GitHub) contribution counts for a repository member. */
export async function getLocalContributionCounts(repositoryId: string, userId: string) {
  const [pullRequests, issues] = await Promise.all([
    prisma.pullRequest.count({ where: { repositoryId, authorId: userId } }),
    prisma.issue.count({ where: { repositoryId, authorId: userId } }),
  ]);
  return { pullRequests, issues };
}

export function listRepositoryMembers(repositoryId: string) {
  return prisma.repositoryMember.findMany({
    where: { repositoryId },
    include: { user: true },
  });
}
