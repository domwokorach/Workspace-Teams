"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Users } from "lucide-react";
import { EditorWorkspace } from "@/components/editor/editor-workspace";
import { ResizableWorkspace, type ResizableSplitHandle } from "@/components/layout/resizable-workspace";
import { ToggleContextPanelButton, ResetLayoutButton } from "@/components/layout/workspace-toolbar-controls";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import type { DirtyFile } from "./git-panel";

const GitPanel = dynamic(() => import("./git-panel").then((m) => m.GitPanel), { ssr: false });

interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  sha?: string;
  loading: boolean;
}

export function CodeWorkspace({
  repositoryId,
  defaultBranch,
}: {
  repositoryId: string;
  defaultBranch: string;
}) {
  const [openFiles, setOpenFiles] = React.useState<OpenFile[]>([]);
  const [activePath, setActivePath] = React.useState<string | null>(null);
  const [branch, setBranch] = React.useState(defaultBranch);
  const [staged, setStaged] = React.useState<Set<string>>(new Set());
  const [gitPanelOpen, setGitPanelOpen] = React.useState(true);
  const [mobileGitOpen, setMobileGitOpen] = React.useState(false);
  const breakpoint = useBreakpoint();
  const workspaceRef = React.useRef<ResizableSplitHandle>(null);

  const activeFile = openFiles.find((f) => f.path === activePath) ?? null;

  async function openFile(path: string) {
    setActivePath(path);
    if (openFiles.some((f) => f.path === path)) return;

    setOpenFiles((prev) => [...prev, { path, content: "", originalContent: "", loading: true }]);
    const res = await fetch(
      `/api/repositories/${repositoryId}/file-content?path=${encodeURIComponent(path)}&ref=${encodeURIComponent(branch)}`,
    );
    const data = await res.json();
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === path
          ? { path, content: data.content ?? "", originalContent: data.content ?? "", sha: data.sha, loading: false }
          : f,
      ),
    );
  }

  function closeFile(path: string) {
    setOpenFiles((prev) => prev.filter((f) => f.path !== path));
    setStaged((prev) => {
      const next = new Set(prev);
      next.delete(path);
      return next;
    });
    if (activePath === path) {
      const remaining = openFiles.filter((f) => f.path !== path);
      setActivePath(remaining.at(-1)?.path ?? null);
    }
  }

  function updateContent(path: string, content: string) {
    setOpenFiles((prev) => prev.map((f) => (f.path === path ? { ...f, content } : f)));
  }

  const dirtyFiles: DirtyFile[] = openFiles
    .filter((f) => !f.loading && f.content !== f.originalContent)
    .map((f) => ({ path: f.path, content: f.content, sha: f.sha, staged: staged.has(f.path) }));

  function toggleStaged(path: string) {
    setStaged((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function handleCommitted(paths: string[]) {
    setOpenFiles((prev) => prev.map((f) => (paths.includes(f.path) ? { ...f, originalContent: f.content } : f)));
    setStaged((prev) => {
      const next = new Set(prev);
      paths.forEach((p) => next.delete(p));
      return next;
    });
  }

  const tabs = openFiles.map((f) => ({ path: f.path, dirty: !f.loading && f.content !== f.originalContent }));
  const contextOpen = breakpoint === "desktop" ? gitPanelOpen : false;

  const main = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/20 px-2 py-1.5 text-xs">
        <Users className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Live coding · you</span>
        <div className="ml-auto flex items-center gap-1">
          <ResetLayoutButton onReset={() => workspaceRef.current?.reset()} />
          <ToggleContextPanelButton
            open={breakpoint === "desktop" ? gitPanelOpen : mobileGitOpen}
            onToggle={() =>
              breakpoint === "desktop" ? setGitPanelOpen((v) => !v) : setMobileGitOpen((v) => !v)
            }
          />
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <EditorWorkspace
          repositoryId={repositoryId}
          activeFile={activeFile}
          tabs={tabs}
          activePath={activePath}
          onSelectFile={setActivePath}
          onCloseTab={closeFile}
          onOpenFile={openFile}
          onChangeContent={updateContent}
        />
      </div>
    </div>
  );

  const gitPanel = (
    <GitPanel
      repositoryId={repositoryId}
      branch={branch}
      onBranchChange={setBranch}
      dirtyFiles={dirtyFiles}
      onToggleStaged={toggleStaged}
      onCommitted={handleCommitted}
    />
  );

  if (breakpoint !== "desktop") {
    return (
      <div className="h-full min-h-0">
        {main}
        <Sheet open={mobileGitOpen} onOpenChange={setMobileGitOpen}>
          <SheetContent side="right" className="w-80 p-0">
            <SheetTitle className="sr-only">Git</SheetTitle>
            {gitPanel}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <ResizableWorkspace
      ref={workspaceRef}
      storageId="workspace.code"
      main={main}
      mainDefaultSize={80}
      mainMinSize={40}
      context={gitPanel}
      contextOpen={contextOpen}
      contextDefaultSize={20}
      contextMinSize={15}
      contextMaxSize={40}
    />
  );
}
