import Link from "next/link";
import {
  FolderGit2,
  CircleDot,
  GitPullRequest,
  XCircle,
  Users,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getDefaultWorkspace } from "@/lib/workspace";
import { formatDistanceToNow } from "date-fns";

const ACTIVITY_LABEL: Record<string, string> = {
  ISSUE_OPENED: "opened an issue",
  ISSUE_CLOSED: "closed an issue",
  PR_OPENED: "opened a pull request",
  PR_MERGED: "merged a pull request",
  PR_CLOSED: "closed a pull request",
  COMMIT_PUSHED: "pushed a commit",
  BUILD_PASSED: "build passed",
  BUILD_FAILED: "build failed",
  CONTRIBUTOR_JOINED: "joined the repository",
  REVIEW_COMPLETED: "completed a review",
};

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const workspace = await getDefaultWorkspace(user.id).catch(() => null);

  if (!workspace) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground">Setting up your workspace…</p>
      </div>
    );
  }

  const [
    repoCount,
    openIssues,
    openPRs,
    failedTests,
    memberCount,
    channelCount,
    activities,
    assignedIssues,
    assignedPRs,
    repos,
  ] = await Promise.all([
    prisma.repository.count({ where: { workspaceId: workspace.id } }),
    prisma.issue.count({ where: { repository: { workspaceId: workspace.id }, state: "OPEN" } }),
    prisma.pullRequest.count({ where: { repository: { workspaceId: workspace.id }, state: { in: ["OPEN", "DRAFT"] } } }),
    prisma.testRun.count({ where: { repository: { workspaceId: workspace.id }, status: "FAILED" } }),
    prisma.workspaceMember.count({ where: { workspaceId: workspace.id } }),
    prisma.channel.count({ where: { workspaceId: workspace.id } }),
    prisma.activity.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: true, repository: true },
    }),
    prisma.issue.findMany({
      where: { repository: { workspaceId: workspace.id }, assignees: { some: { id: user.id } }, state: "OPEN" },
      take: 5,
      include: { repository: true },
    }),
    prisma.pullRequest.findMany({
      where: {
        repository: { workspaceId: workspace.id },
        OR: [{ authorId: user.id }, { reviewers: { some: { id: user.id } } }],
        state: { in: ["OPEN", "DRAFT"] },
      },
      take: 5,
      include: { repository: true },
    }),
    prisma.repository.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { commits: true, branches: true, pullRequests: true } } },
    }),
  ]);

  const cards = [
    { label: "Active Repositories", value: repoCount, icon: FolderGit2, href: "/repositories" },
    { label: "Open Issues", value: openIssues, icon: CircleDot, href: "/issues" },
    { label: "Open Pull Requests", value: openPRs, icon: GitPullRequest, href: "/pull-requests" },
    { label: "Failed Tests", value: failedTests, icon: XCircle, href: "/tests" },
    { label: "Team Members", value: memberCount, icon: Users, href: "/contributors" },
    { label: "Channels", value: channelCount, icon: MessageSquare, href: "/messages" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across {workspace.name}.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <c.icon className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <EmptyState message="No activity yet. Import a repository to get started." />
            ) : (
              <ul className="space-y-3">
                {activities.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 text-sm">
                    <Avatar className="size-6">
                      <AvatarImage src={a.actor?.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {a.actor ? `${a.actor.firstName[0]}${a.actor.lastName[0]}` : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        <span className="font-medium">
                          {a.actor ? `${a.actor.firstName} ${a.actor.lastName}` : "Someone"}
                        </span>{" "}
                        <span className="text-muted-foreground">{ACTIVITY_LABEL[a.type] ?? a.summary}</span>
                        {a.repository && (
                          <span className="text-muted-foreground"> in {a.repository.fullName}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Assigned to Me</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Issues</p>
              {assignedIssues.length === 0 ? (
                <p className="text-xs text-muted-foreground">No issues assigned.</p>
              ) : (
                <ul className="space-y-1.5">
                  {assignedIssues.map((i) => (
                    <li key={i.id}>
                      <Link
                        href={`/repositories/${i.repositoryId}/issues/${i.number}`}
                        className="flex items-center gap-1.5 text-sm hover:underline"
                      >
                        <span className="text-muted-foreground">#{i.number}</span>
                        <span className="truncate">{i.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Pull Requests</p>
              {assignedPRs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No pull requests assigned.</p>
              ) : (
                <ul className="space-y-1.5">
                  {assignedPRs.map((pr) => (
                    <li key={pr.id}>
                      <Link
                        href={`/repositories/${pr.repositoryId}/pull-requests/${pr.number}`}
                        className="flex items-center gap-1.5 text-sm hover:underline"
                      >
                        <span className="text-muted-foreground">#{pr.number}</span>
                        <span className="truncate">{pr.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Repository Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {repos.length === 0 ? (
            <EmptyState message="No repositories connected yet. Connect GitHub to import your first repository." action={{ label: "Find a repository", href: "/repositories/find" }} />
          ) : (
            <div className="divide-y">
              {repos.map((r) => (
                <Link
                  key={r.id}
                  href={`/repositories/${r.id}`}
                  className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-accent/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderGit2 className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-mono">{r.fullName}</span>
                    {r.isPrivate && <Badge variant="secondary">Private</Badge>}
                  </div>
                  <div className="hidden shrink-0 items-center gap-4 text-xs text-muted-foreground sm:flex">
                    <span>{r._count.commits} commits</span>
                    <span>{r._count.branches} branches</span>
                    <span>{r._count.pullRequests} PRs</span>
                    <ArrowUpRight className="size-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ message, action }: { message: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && (
        <Link href={action.href} className="text-sm font-medium text-primary hover:underline">
          {action.label}
        </Link>
      )}
    </div>
  );
}
