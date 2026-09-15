"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { X, Circle, Loader2, PanelRightOpen, PanelRightClose, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileExplorer } from "@/components/editor/file-explorer";
import { languageForFile } from "@/lib/file-icons";
import { cn } from "@/lib/utils";
import type { DirtyFile } from "./git-panel";

const MonacoCodeEditor = dynamic(
  () => import("@/components/editor/monaco-code-editor").then((m) => m.MonacoCodeEditor),
  { ssr: false },
);
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

  return (
    <div className="grid h-full grid-cols-[220px_1fr] md:grid-cols-[240px_1fr_280px]">
      <FileExplorer repositoryId={repositoryId} selectedPath={activePath} onSelect={openFile} />

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2 border-b bg-muted/20 px-2 py-1.5 text-xs">
          <Users className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Live coding · you</span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto md:hidden"
            onClick={() => setGitPanelOpen((v) => !v)}
            aria-label="Toggle git panel"
          >
            {gitPanelOpen ? <PanelRightClose className="size-3.5" /> : <PanelRightOpen className="size-3.5" />}
          </Button>
        </div>

        {openFiles.length > 0 && (
          <div className="flex overflow-x-auto border-b bg-muted/10">
            {openFiles.map((f) => {
              const dirty = !f.loading && f.content !== f.originalContent;
              return (
                <button
                  key={f.path}
                  onClick={() => setActivePath(f.path)}
                  className={cn(
                    "group flex shrink-0 items-center gap-1.5 border-r px-3 py-1.5 text-xs",
                    activePath === f.path ? "bg-background" : "text-muted-foreground hover:bg-accent/50",
                  )}
                >
                  <span className="max-w-40 truncate font-mono">{f.path.split("/").pop()}</span>
                  {dirty ? (
                    <Circle className="size-2 shrink-0 fill-current text-primary" />
                  ) : (
                    <X
                      className="size-3 shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeFile(f.path);
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="min-h-0 flex-1">
          {!activeFile ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Select a file to start editing
            </div>
          ) : activeFile.loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MonacoCodeEditor
              path={activeFile.path}
              value={activeFile.content}
              language={languageForFile(activeFile.path)}
              onChange={(v) => updateContent(activeFile.path, v)}
            />
          )}
        </div>
      </div>

      <div className={cn("hidden border-l md:block", !gitPanelOpen && "md:hidden")}>
        <GitPanel
          repositoryId={repositoryId}
          branch={branch}
          onBranchChange={setBranch}
          dirtyFiles={dirtyFiles}
          onToggleStaged={toggleStaged}
          onCommitted={handleCommitted}
        />
      </div>
    </div>
  );
}
