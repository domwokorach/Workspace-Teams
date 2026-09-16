"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { FileExplorer } from "@/components/editor/file-explorer";
import { EditorTabs, type EditorTab } from "@/components/editor/editor-tabs";
import { BottomPanel } from "@/components/editor/bottom-panel";
import { ResizableSplit, type ResizablePaneSpec, type ResizableSplitHandle } from "@/components/layout/resizable-workspace";
import { ToggleBottomPanelButton } from "@/components/layout/workspace-toolbar-controls";
import { useWorkspaceShortcuts } from "@/hooks/use-workspace-shortcuts";
import { languageForFile } from "@/lib/file-icons";

const MonacoCodeEditor = dynamic(
  () => import("@/components/editor/monaco-code-editor").then((m) => m.MonacoCodeEditor),
  { ssr: false },
);

interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  loading: boolean;
}

export function EditorWorkspace({
  repositoryId,
  activeFile,
  tabs,
  activePath,
  onSelectFile,
  onCloseTab,
  onOpenFile,
  onChangeContent,
}: {
  repositoryId: string;
  activeFile: OpenFile | null;
  tabs: EditorTab[];
  activePath: string | null;
  onSelectFile: (path: string) => void;
  onCloseTab: (path: string) => void;
  onOpenFile: (path: string) => void;
  onChangeContent: (path: string, content: string) => void;
}) {
  const [bottomOpen, setBottomOpen] = React.useState(true);
  const splitRef = React.useRef<ResizableSplitHandle>(null);

  useWorkspaceShortcuts({ onToggleBottomPanel: () => setBottomOpen((v) => !v) });

  const topPane = (
    <ResizableSplit
      storageId="workspace.editor.explorer"
      orientation="horizontal"
      panes={[
        { id: "explorer", content: <FileExplorer repositoryId={repositoryId} selectedPath={activePath} onSelect={onOpenFile} />, defaultSize: 24, minSize: 15, maxSize: 45 },
        {
          id: "editor",
          content: (
            <div className="flex h-full min-w-0 flex-col">
              <EditorTabs tabs={tabs} activePath={activePath} onSelect={onSelectFile} onClose={onCloseTab} />
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
                    onChange={(v) => onChangeContent(activeFile.path, v)}
                  />
                )}
              </div>
            </div>
          ),
          defaultSize: 76,
          minSize: 40,
        },
      ]}
    />
  );

  const panes: ResizablePaneSpec[] = [
    { id: "top", content: topPane, defaultSize: 72, minSize: 30 },
    { id: "bottom", content: <BottomPanel />, defaultSize: 28, minSize: 15, maxSize: 70, hidden: !bottomOpen },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-end gap-1 border-b bg-muted/10 px-2 py-1">
        <ToggleBottomPanelButton open={bottomOpen} onToggle={() => setBottomOpen((v) => !v)} />
      </div>
      <div className="min-h-0 flex-1">
        <ResizableSplit ref={splitRef} storageId="workspace.editor.vertical" orientation="vertical" panes={panes} />
      </div>
    </div>
  );
}
