import Link from "next/link";
import { GitPullRequest, GitMerge, GitPullRequestClosed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getDefaultWorkspace } from "@/lib/workspace";
import { formatDistanceToNow } from "date-fns";

const STATE_ICON = { OPEN: GitPullRequest, DRAFT: GitPullRequest, MERGED: GitMerge, CLOSED: GitPullRequestClosed };
const STATE_COLOR = { OPEN: "text-emerald-500", DRAFT: "text-muted-foreground", MERGED: "text-purple-500", CLOSED: "text-red-500" };

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

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Pull Requests</h1>
        <p className="text-sm text-muted-foreground">Across all repositories in your workspace.</p>
      </div>

      {pullRequests.length === 0 ? (
        <div className="rounded-lg border py-16 text-center text-sm text-muted-foreground">
          No open pull requests. Your team is all caught up.
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {pullRequests.map((pr) => {
            const Icon = STATE_ICON[pr.state];
            return (
              <Link
                key={pr.id}
                href={`/repositories/${pr.repositoryId}/pull-requests/${pr.number}`}
                className="flex items-start gap-3 p-3 hover:bg-accent/50"
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${STATE_COLOR[pr.state]}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {pr.title} <span className="font-normal text-muted-foreground">#{pr.number}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[10px]">{pr.repository.fullName}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {pr.sourceBranch} → {pr.targetBranch}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      updated {formatDistanceToNow(pr.updatedAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
