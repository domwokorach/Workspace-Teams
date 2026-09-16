"use client";

import * as React from "react";
import { FileText, CheckCircle2, XCircle, MessageCircle } from "lucide-react";
import { iconForFile } from "@/lib/file-icons";
import { cn } from "@/lib/utils";
import { DiffViewer } from "./diff-viewer";
import { ResizableWorkspace, type ResizableSplitHandle } from "@/components/layout/resizable-workspace";
import { ToggleContextPanelButton, ResetLayoutButton } from "@/components/layout/workspace-toolbar-controls";

interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
}

interface Review {
  id: number;
  state: string;
  body: string | null;
  reviewer: { login: string } | null;
  submittedAt: string | null;
}

const REVIEW_ICON: Record<string, React.ElementType> = {
  APPROVED: CheckCircle2,
  CHANGES_REQUESTED: XCircle,
  COMMENTED: MessageCircle,
};

const REVIEW_COLOR: Record<string, string> = {
  APPROVED: "text-emerald-500",
  CHANGES_REQUESTED: "text-red-500",
  COMMENTED: "text-muted-foreground",
};

export function PullRequestFiles({ files, reviews }: { files: FileChange[]; reviews: Review[] }) {
  const [selected, setSelected] = React.useState(files[0]?.filename ?? null);
  const [contextOpen, setContextOpen] = React.useState(true);
  const workspaceRef = React.useRef<ResizableSplitHandle>(null);

  const activeFile = files.find((f) => f.filename === selected) ?? files[0] ?? null;

  const fileList = (
    <div className="flex h-full flex-col overflow-y-auto">
      <p className="shrink-0 border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Changed files ({files.length})
      </p>
      <ul className="flex-1 overflow-y-auto py-1">
        {files.map((f) => {
          const Icon = iconForFile(f.filename);
          return (
            <li key={f.filename}>
              <button
                onClick={() => setSelected(f.filename)}
                className={cn(
                  "flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs hover:bg-accent",
                  activeFile?.filename === f.filename && "bg-accent",
                )}
              >
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-mono">{f.filename}</span>
                <span className="shrink-0 font-mono text-[10px]">
                  <span className="text-emerald-500">+{f.additions}</span>{" "}
                  <span className="text-red-500">-{f.deletions}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const diff = (
    <div className="h-full overflow-y-auto p-3">
      {activeFile ? (
        <DiffViewer
          filename={activeFile.filename}
          patch={activeFile.patch}
          additions={activeFile.additions}
          deletions={activeFile.deletions}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          <FileText className="mr-2 size-4" /> No changed files.
        </div>
      )}
    </div>
  );

  const context = (
    <div className="flex h-full flex-col overflow-y-auto p-3 text-xs">
      <p className="mb-2 font-medium uppercase tracking-wide text-muted-foreground">Reviewers</p>
      {reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews yet.</p>
      ) : (
        <ul className="space-y-2">
          {reviews.map((r) => {
            const Icon = REVIEW_ICON[r.state] ?? MessageCircle;
            return (
              <li key={r.id} className="flex items-center gap-1.5">
                <Icon className={cn("size-3.5 shrink-0", REVIEW_COLOR[r.state])} />
                <span className="truncate">{r.reviewer?.login ?? "Unknown"}</span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 mb-2 font-medium uppercase tracking-wide text-muted-foreground">Checks</p>
      <p className="text-muted-foreground">See the Checks tab for full workflow status.</p>
    </div>
  );

  return (
    <div className="flex h-[75vh] min-h-[420px] flex-col overflow-hidden rounded-lg border">
      <div className="flex shrink-0 items-center justify-end gap-1 border-b bg-muted/10 px-2 py-1">
        <ResetLayoutButton onReset={() => workspaceRef.current?.reset()} />
        <ToggleContextPanelButton open={contextOpen} onToggle={() => setContextOpen((v) => !v)} />
      </div>
      <div className="min-h-0 flex-1">
        <ResizableWorkspace
          ref={workspaceRef}
          storageId="workspace.pr-files"
          sidebar={fileList}
          sidebarDefaultSize={25}
          sidebarMinSize={15}
          sidebarMaxSize={45}
          main={diff}
          mainDefaultSize={55}
          mainMinSize={40}
          context={context}
          contextOpen={contextOpen}
          contextDefaultSize={20}
          contextMinSize={15}
          contextMaxSize={35}
        />
      </div>
    </div>
  );
}
