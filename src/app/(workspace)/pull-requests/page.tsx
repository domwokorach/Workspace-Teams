import { Suspense } from "react";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getDefaultWorkspace } from "@/lib/workspace";
import { AllPullRequestsWorkspace, type AllPullRequestsRow } from "@/components/pull-requests/all-pull-requests-workspace";

export default async function AllPullRequestsPage() {
  const user = await requireCurrentUser();
  const workspace = await getDefaultWorkspace(user.id).catch(() => null);

  const pullRequests = workspace
    ? await prisma.pullRequest.findMany({
        where: { repository: { workspaceId: workspace.id } },
        orderBy: { updatedAt: "desc" },
        take: 100,
        include: { repository: true, author: true },
      })
    : [];

  const rows: AllPullRequestsRow[] = pullRequests.map((pr) => ({
    id: pr.id,
    number: pr.number,
    title: pr.title,
    state: pr.state,
    sourceBranch: pr.sourceBranch,
    targetBranch: pr.targetBranch,
    updatedAt: pr.updatedAt.toISOString(),
    repositoryId: pr.repositoryId,
    repository: { fullName: pr.repository.fullName },
  }));

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Pull Requests</h1>
        <p className="text-sm text-muted-foreground">Across all repositories in your workspace.</p>
      </div>
      <Suspense>
        <AllPullRequestsWorkspace pullRequests={rows} />
      </Suspense>
    </div>
  );
}
