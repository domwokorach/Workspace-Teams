"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GitPullRequest, GitMerge, GitPullRequestClosed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { PullRequestDetail } from "./pull-request-detail";
import { ResizableWorkspace, type ResizableSplitHandle } from "@/components/layout/resizable-workspace";
import { ResetLayoutButton } from "@/components/layout/workspace-toolbar-controls";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";

export interface AllPullRequestsRow {
  id: string;
  number: number;
  title: string;
  state: "OPEN" | "DRAFT" | "MERGED" | "CLOSED";
  sourceBranch: string;
  targetBranch: string;
  updatedAt: string;
  repositoryId: string;
  repository: { fullName: string };
}

const STATE_ICON: Record<AllPullRequestsRow["state"], React.ElementType> = {
  OPEN: GitPullRequest,
  DRAFT: GitPullRequest,
  MERGED: GitMerge,
  CLOSED: GitPullRequestClosed,
};

const STATE_COLOR: Record<AllPullRequestsRow["state"], string> = {
  OPEN: "text-emerald-500",
  DRAFT: "text-muted-foreground",
  MERGED: "text-purple-500",
  CLOSED: "text-red-500",
};

/**
 * Cross-repository master/detail shell for the top-level /pull-requests
 * page. Each row can belong to a different repository, so the list is
 * rendered inline here rather than reusing the repo-scoped <PullRequestList>.
 */
export function AllPullRequestsWorkspace({ pullRequests }: { pullRequests: AllPullRequestsRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const breakpoint = useBreakpoint();
  const workspaceRef = React.useRef<ResizableSplitHandle>(null);

  const repoParam = searchParams.get("repo");
  const numberParam = searchParams.get("number");
  const selected =
    repoParam && numberParam
      ? pullRequests.find((pr) => pr.repositoryId === repoParam && pr.number === Number(numberParam)) ?? null
      : null;

  function select(pr: AllPullRequestsRow) {
    if (breakpoint === "desktop") {
      router.replace(`/pull-requests?repo=${pr.repositoryId}&number=${pr.number}`, { scroll: false });
    } else {
      router.push(`/repositories/${pr.repositoryId}/pull-requests/${pr.number}`);
    }
  }

  const list = (
    <div className="h-full overflow-y-auto">
      {pullRequests.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No open pull requests. Your team is all caught up.
        </div>
      ) : (
        <ul className="divide-y">
          {pullRequests.map((pr) => {
            const Icon = STATE_ICON[pr.state];
            const active = selected?.id === pr.id;
            return (
              <li key={pr.id}>
                <button
                  onClick={() => select(pr)}
                  className={cn(
                    "flex w-full items-start gap-3 p-3 text-left hover:bg-accent/50",
                    active && "bg-accent",
                  )}
                >
                  <Icon className={cn("mt-0.5 size-4 shrink-0", STATE_COLOR[pr.state])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {pr.title} <span className="font-normal text-muted-foreground">#{pr.number}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {pr.repository.fullName}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {pr.sourceBranch} → {pr.targetBranch}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        updated {formatDistanceToNow(new Date(pr.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  if (breakpoint !== "desktop") {
    return list;
  }

  const detail = selected ? (
    <div className="h-full overflow-y-auto p-4">
      <PullRequestDetail repositoryId={selected.repositoryId} number={selected.number} />
    </div>
  ) : (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <GitPullRequest className="size-6" />
      Select a pull request to see its details
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] min-h-[480px] flex-col overflow-hidden rounded-lg border">
      <div className="flex shrink-0 items-center justify-end gap-1 border-b bg-muted/10 px-2 py-1">
        <ResetLayoutButton onReset={() => workspaceRef.current?.reset()} />
      </div>
      <div className="min-h-0 flex-1">
        <ResizableWorkspace
          ref={workspaceRef}
          storageId="workspace.all-pull-requests"
          sidebar={list}
          sidebarDefaultSize={35}
          sidebarMinSize={22}
          sidebarMaxSize={50}
          main={detail}
          mainDefaultSize={65}
          mainMinSize={40}
        />
      </div>
    </div>
  );
}
