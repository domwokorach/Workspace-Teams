import { Suspense } from "react";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getDefaultWorkspace } from "@/lib/workspace";
import { AllIssuesWorkspace, type AllIssuesRow } from "@/components/issues/all-issues-workspace";

export default async function AllIssuesPage() {
  const user = await requireCurrentUser();
  const workspace = await getDefaultWorkspace(user.id).catch(() => null);

  const issues = workspace
    ? await prisma.issue.findMany({
        where: { repository: { workspaceId: workspace.id } },
        orderBy: { updatedAt: "desc" },
        take: 100,
        include: { repository: true, author: true },
      })
    : [];

  const rows: AllIssuesRow[] = issues.map((issue) => ({
    id: issue.id,
    number: issue.number,
    title: issue.title,
    state: issue.state,
    labels: issue.labels,
    updatedAt: issue.updatedAt.toISOString(),
    repositoryId: issue.repositoryId,
    repository: { fullName: issue.repository.fullName },
  }));

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Issues</h1>
        <p className="text-sm text-muted-foreground">Across all repositories in your workspace.</p>
      </div>
      <Suspense>
        <AllIssuesWorkspace issues={rows} />
      </Suspense>
    </div>
  );
}
