"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleDot, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { IssueDetail } from "./issue-detail";
import { ResizableWorkspace, type ResizableSplitHandle } from "@/components/layout/resizable-workspace";
import { ResetLayoutButton } from "@/components/layout/workspace-toolbar-controls";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";

export interface AllIssuesRow {
  id: string;
  number: number;
  title: string;
  state: "OPEN" | "CLOSED";
  labels: string[];
  updatedAt: string;
  repositoryId: string;
  repository: { fullName: string };
}

/**
 * Cross-repository master/detail shell for the top-level /issues page.
 * Unlike the repository-scoped IssuesWorkspace, each row can belong to a
 * different repository, so the list is rendered inline here rather than
 * reusing the repo-scoped <IssueList> (which fetches from a single repo).
 */
export function AllIssuesWorkspace({ issues }: { issues: AllIssuesRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const breakpoint = useBreakpoint();
  const workspaceRef = React.useRef<ResizableSplitHandle>(null);

  const repoParam = searchParams.get("repo");
  const numberParam = searchParams.get("number");
  const selected =
    repoParam && numberParam
      ? issues.find((i) => i.repositoryId === repoParam && i.number === Number(numberParam)) ?? null
      : null;

  function select(issue: AllIssuesRow) {
    if (breakpoint === "desktop") {
      router.replace(`/issues?repo=${issue.repositoryId}&number=${issue.number}`, { scroll: false });
    } else {
      router.push(`/repositories/${issue.repositoryId}/issues/${issue.number}`);
    }
  }

  const list = (
    <div className="h-full overflow-y-auto">
      {issues.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No issues yet. Import a repository to see its issues here.
        </div>
      ) : (
        <ul className="divide-y">
          {issues.map((issue) => {
            const active = selected?.id === issue.id;
            return (
              <li key={issue.id}>
                <button
                  onClick={() => select(issue)}
                  className={cn(
                    "flex w-full items-start gap-3 p-3 text-left hover:bg-accent/50",
                    active && "bg-accent",
                  )}
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
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {issue.repository.fullName}
                      </Badge>
                      {issue.labels.map((l) => (
                        <Badge key={l} variant="secondary" className="text-[10px]">
                          {l}
                        </Badge>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        updated {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
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
      <IssueDetail repositoryId={selected.repositoryId} number={selected.number} />
    </div>
  ) : (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <CircleDot className="size-6" />
      Select an issue to see its details
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] min-h-[480px] flex-col overflow-hidden rounded-md border">
      <div className="flex shrink-0 items-center justify-end gap-1 border-b bg-muted/10 px-2 py-1">
        <ResetLayoutButton onReset={() => workspaceRef.current?.reset()} />
      </div>
      <div className="min-h-0 flex-1">
        <ResizableWorkspace
          ref={workspaceRef}
          storageId="workspace.all-issues"
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
