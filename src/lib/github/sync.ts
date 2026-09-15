import "server-only";
import { prisma } from "@/lib/db/client";
import type { Repository } from "@/generated/prisma/client";
import { listIssues } from "./issues";
import { listPullRequests } from "./pull-requests";

export async function syncRepositoryIssues(userId: string, repository: Repository) {
  const issues = await listIssues(userId, repository.owner, repository.name, { state: "all", perPage: 100 });
  for (const issue of issues) {
    await prisma.issue.upsert({
      where: { repositoryId_number: { repositoryId: repository.id, number: issue.number } },
      update: {
        title: issue.title,
        description: issue.body,
        state: issue.state === "open" ? "OPEN" : "CLOSED",
        labels: issue.labels.map((l) => l.name),
        commentsCount: issue.comments,
        closedAt: issue.closedAt ? new Date(issue.closedAt) : null,
      },
      create: {
        repositoryId: repository.id,
        number: issue.number,
        title: issue.title,
        description: issue.body,
        state: issue.state === "open" ? "OPEN" : "CLOSED",
        labels: issue.labels.map((l) => l.name),
        commentsCount: issue.comments,
        createdAt: new Date(issue.createdAt),
        closedAt: issue.closedAt ? new Date(issue.closedAt) : null,
      },
    });
  }
  return issues.length;
}

export async function syncRepositoryPullRequests(userId: string, repository: Repository) {
  const prs = await listPullRequests(userId, repository.owner, repository.name, { state: "all", perPage: 100 });
  for (const pr of prs) {
    await prisma.pullRequest.upsert({
      where: { repositoryId_number: { repositoryId: repository.id, number: pr.number } },
      update: {
        title: pr.title,
        description: pr.body,
        state: pr.merged ? "MERGED" : pr.state === "open" ? (pr.draft ? "DRAFT" : "OPEN") : "CLOSED",
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changedFiles,
        commentsCount: pr.comments,
        mergedAt: pr.mergedAt ? new Date(pr.mergedAt) : null,
        closedAt: pr.closedAt ? new Date(pr.closedAt) : null,
      },
      create: {
        repositoryId: repository.id,
        number: pr.number,
        title: pr.title,
        description: pr.body,
        sourceBranch: pr.sourceBranch,
        targetBranch: pr.targetBranch,
        state: pr.merged ? "MERGED" : pr.state === "open" ? (pr.draft ? "DRAFT" : "OPEN") : "CLOSED",
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changedFiles,
        commentsCount: pr.comments,
        createdAt: new Date(pr.createdAt),
        mergedAt: pr.mergedAt ? new Date(pr.mergedAt) : null,
        closedAt: pr.closedAt ? new Date(pr.closedAt) : null,
      },
    });
  }
  return prs.length;
}
