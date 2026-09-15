import Link from "next/link";
import { CircleDot, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getDefaultWorkspace } from "@/lib/workspace";
import { formatDistanceToNow } from "date-fns";

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

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Issues</h1>
        <p className="text-sm text-muted-foreground">Across all repositories in your workspace.</p>
      </div>

      {issues.length === 0 ? (
        <div className="rounded-lg border py-16 text-center text-sm text-muted-foreground">
          No issues yet. Import a repository to see its issues here.
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/repositories/${issue.repositoryId}/issues/${issue.number}`}
              className="flex items-start gap-3 p-3 hover:bg-accent/50"
            >
              {issue.state === "OPEN" ? (
                <CircleDot className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-purple-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {issue.title} <span className="font-normal text-muted-foreground">#{issue.number}</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-[10px]">{issue.repository.fullName}</Badge>
                  {issue.labels.map((l) => (
                    <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>
                  ))}
                  <span className="text-xs text-muted-foreground">
                    updated {formatDistanceToNow(issue.updatedAt, { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
