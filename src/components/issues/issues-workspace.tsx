"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleDot } from "lucide-react";
import { IssueList } from "./issue-list";
import { IssueDetail } from "./issue-detail";
import { ResizableWorkspace, type ResizableSplitHandle } from "@/components/layout/resizable-workspace";
import { ResetLayoutButton } from "@/components/layout/workspace-toolbar-controls";
import { useBreakpoint } from "@/hooks/use-breakpoint";

/**
 * Master/detail resizable shell for a repository's issues. The dedicated
 * `/issues/[number]` route still works for direct links; this view keeps the
 * list mounted alongside the detail instead of a full navigation.
 */
export function IssuesWorkspace({ repositoryId, currentUserId }: { repositoryId: string; currentUserId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const breakpoint = useBreakpoint();
  const workspaceRef = React.useRef<ResizableSplitHandle>(null);

  const numberParam = searchParams.get("number");
  const selectedNumber = numberParam ? Number(numberParam) : null;

  function selectIssue(number: number) {
    if (breakpoint === "desktop") {
      router.replace(`/repositories/${repositoryId}/issues?number=${number}`, { scroll: false });
    } else {
      router.push(`/repositories/${repositoryId}/issues/${number}`);
    }
  }

  const list = (
    <div className="h-full overflow-y-auto p-3">
      <IssueList
        repositoryId={repositoryId}
        currentUserId={currentUserId}
        onSelect={breakpoint === "desktop" ? selectIssue : undefined}
        selectedNumber={selectedNumber}
      />
    </div>
  );

  if (breakpoint !== "desktop") {
    return list;
  }

  const detail = selectedNumber ? (
    <div className="h-full overflow-y-auto p-3">
      <IssueDetail repositoryId={repositoryId} number={selectedNumber} />
    </div>
  ) : (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <CircleDot className="size-6" />
      Select an issue to see its details
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[480px] flex-col overflow-hidden rounded-md border">
      <div className="flex shrink-0 items-center justify-end gap-1 border-b bg-muted/10 px-2 py-1">
        <ResetLayoutButton onReset={() => workspaceRef.current?.reset()} />
      </div>
      <div className="min-h-0 flex-1">
        <ResizableWorkspace
          ref={workspaceRef}
          storageId="workspace.issues"
          sidebar={list}
          sidebarDefaultSize={32}
          sidebarMinSize={20}
          sidebarMaxSize={45}
          main={detail}
          mainDefaultSize={68}
          mainMinSize={40}
        />
      </div>
    </div>
  );
}
