"use client";

import * as React from "react";
import Link from "next/link";
import { GitPullRequest, GitMerge, GitPullRequestClosed, Loader2, MessageSquare } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface PRRow {
  id: string;
  number: number;
  title: string;
  state: "OPEN" | "DRAFT" | "MERGED" | "CLOSED";
  sourceBranch: string;
  targetBranch: string;
  commentsCount: number;
  checksStatus: string;
  updatedAt: string;
  author: { firstName: string; lastName: string } | null;
  reviews: { state: string }[];
}

const TABS = [
  { value: "open", label: "Open" },
  { value: "draft", label: "Draft" },
  { value: "review-requested", label: "Review Requested" },
  { value: "merged", label: "Merged" },
  { value: "closed", label: "Closed" },
];

const STATE_ICON: Record<string, React.ElementType> = {
  OPEN: GitPullRequest,
  DRAFT: GitPullRequest,
  MERGED: GitMerge,
  CLOSED: GitPullRequestClosed,
};

const STATE_COLOR: Record<string, string> = {
  OPEN: "text-emerald-500",
  DRAFT: "text-muted-foreground",
  MERGED: "text-purple-500",
  CLOSED: "text-red-500",
};

export function PullRequestList({ repositoryId }: { repositoryId: string }) {
  const [tab, setTab] = React.useState("open");
  const [prs, setPrs] = React.useState<PRRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    queueMicrotask(() => setLoading(true));
    fetch(`/api/repositories/${repositoryId}/pull-requests?tab=${tab}`)
      .then((r) => r.json())
      .then((data) => setPrs(data.pullRequests ?? []))
      .finally(() => setLoading(false));
  }, [repositoryId, tab]);

  const approvals = (reviews: { state: string }[]) => reviews.filter((r) => r.state === "APPROVED").length;

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : prs.length === 0 ? (
        <div className="rounded-md border py-16 text-center text-sm text-muted-foreground">
          No pull requests found for this view.
        </div>
      ) : (
        <div className="divide-y rounded-md border">
          {prs.map((pr) => {
            const Icon = STATE_ICON[pr.state];
            return (
              <Link
                key={pr.id}
                href={`/repositories/${repositoryId}/pull-requests/${pr.number}`}
                className="flex items-start gap-3 p-3 hover:bg-accent/50"
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${STATE_COLOR[pr.state]}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {pr.title} <span className="font-normal text-muted-foreground">#{pr.number}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {pr.sourceBranch} → {pr.targetBranch}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {pr.author && <span>{pr.author.firstName} {pr.author.lastName}</span>}
                    <span>updated {formatDistanceToNow(new Date(pr.updatedAt), { addSuffix: true })}</span>
                    {approvals(pr.reviews) > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{approvals(pr.reviews)} approvals</Badge>
                    )}
                  </div>
                </div>
                {pr.commentsCount > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="size-3.5" /> {pr.commentsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
