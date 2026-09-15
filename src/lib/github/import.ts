import "server-only";
import { prisma } from "@/lib/db/client";
import { getDefaultWorkspace } from "@/lib/workspace";
import { getRepository, listBranches, listCommits } from "./repositories";
import { syncRepositoryIssues, syncRepositoryPullRequests } from "./sync";
import type { ImportStage, ImportProgressEvent } from "@/types/import";

export type { ImportStage, ImportProgressEvent };

/**
 * Imports a GitHub repository into the user's workspace, syncing branches,
 * recent commits, issues, and pull requests. Yields progress events so the
 * caller (an SSE route) can stream staged progress to the UI.
 */
export async function* importRepository(
  userId: string,
  owner: string,
  repo: string,
): AsyncGenerator<ImportProgressEvent, { repositoryId: string }, unknown> {
  yield { stage: "authenticating", message: "Authenticating with GitHub…" };
  const workspace = await getDefaultWorkspace(userId);

  yield { stage: "fetching_repository", message: `Fetching ${owner}/${repo}…` };
  const ghRepo = await getRepository(userId, owner, repo);

  const record = await prisma.repository.upsert({
    where: { fullName: ghRepo.fullName },
    update: {
      name: ghRepo.name,
      owner: ghRepo.owner,
      description: ghRepo.description,
      isPrivate: ghRepo.isPrivate,
      language: ghRepo.language,
      defaultBranch: ghRepo.defaultBranch,
      stars: ghRepo.stars,
      forks: ghRepo.forks,
      openIssuesCount: ghRepo.openIssues,
      githubId: BigInt(ghRepo.id),
      githubUrl: ghRepo.htmlUrl,
      cloneUrlHttps: ghRepo.cloneUrlHttps,
      cloneUrlSsh: ghRepo.cloneUrlSsh,
      lastSyncedAt: new Date(),
    },
    create: {
      workspaceId: workspace.id,
      name: ghRepo.name,
      owner: ghRepo.owner,
      fullName: ghRepo.fullName,
      description: ghRepo.description,
      isPrivate: ghRepo.isPrivate,
      language: ghRepo.language,
      defaultBranch: ghRepo.defaultBranch,
      stars: ghRepo.stars,
      forks: ghRepo.forks,
      openIssuesCount: ghRepo.openIssues,
      githubId: BigInt(ghRepo.id),
      githubUrl: ghRepo.htmlUrl,
      cloneUrlHttps: ghRepo.cloneUrlHttps,
      cloneUrlSsh: ghRepo.cloneUrlSsh,
      lastSyncedAt: new Date(),
      members: { create: { userId, role: "OWNER" } },
    },
  });

  await prisma.repositoryMember.upsert({
    where: { repositoryId_userId: { repositoryId: record.id, userId } },
    update: {},
    create: { repositoryId: record.id, userId, role: "OWNER" },
  });

  yield { stage: "loading_branches", message: "Loading branches…" };
  const branches = await listBranches(userId, owner, repo);
  await prisma.$transaction(
    branches.map((b) =>
      prisma.branch.upsert({
        where: { repositoryId_name: { repositoryId: record.id, name: b.name } },
        update: { headSha: b.headSha, isDefault: b.isDefault },
        create: {
          repositoryId: record.id,
          name: b.name,
          isDefault: b.isDefault,
          headSha: b.headSha,
        },
      }),
    ),
  );

  yield { stage: "loading_files", message: "Loading file tree…" };
  const commits = await listCommits(userId, owner, repo, { branch: ghRepo.defaultBranch, perPage: 30 });
  for (const c of commits) {
    await prisma.commit.upsert({
      where: { repositoryId_sha: { repositoryId: record.id, sha: c.sha } },
      update: {},
      create: {
        repositoryId: record.id,
        sha: c.sha,
        message: c.message,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        authorAvatar: c.authorAvatarUrl,
        branch: ghRepo.defaultBranch,
        committedAt: new Date(c.committedAt),
      },
    });
  }

  yield { stage: "loading_issues", message: "Loading issues…" };
  await syncRepositoryIssues(userId, record);

  yield { stage: "loading_pull_requests", message: "Loading pull requests…" };
  await syncRepositoryPullRequests(userId, record);

  yield { stage: "loading_contributors", message: "Loading contributors…" };
  yield { stage: "loading_ci", message: "Checking CI status…" };

  await prisma.activity.create({
    data: {
      workspaceId: workspace.id,
      repositoryId: record.id,
      actorId: userId,
      type: "CONTRIBUTOR_JOINED",
      summary: `Imported ${ghRepo.fullName} from GitHub`,
    },
  });

  yield { stage: "ready", message: "Workspace ready." };
  return { repositoryId: record.id };
}
