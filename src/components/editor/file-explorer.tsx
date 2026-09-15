"use client";

import * as React from "react";
import { ChevronRight, ChevronDown, Loader2, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { iconForFile, FolderIcon, FolderOpenIcon } from "@/lib/file-icons";
import type { GitHubFileEntry } from "@/types/github";

interface TreeNodeState {
  entries: GitHubFileEntry[] | null;
  loading: boolean;
  expanded: boolean;
}

export function FileExplorer({
  repositoryId,
  selectedPath,
  onSelect,
}: {
  repositoryId: string;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [nodes, setNodes] = React.useState<Record<string, TreeNodeState>>({});
  const [filter, setFilter] = React.useState("");

  const loadDir = React.useCallback(
    async (path: string) => {
      setNodes((prev) => ({ ...prev, [path]: { ...prev[path], loading: true, expanded: true, entries: prev[path]?.entries ?? null } }));
      try {
        const res = await fetch(`/api/repositories/${repositoryId}/files?path=${encodeURIComponent(path)}`);
        const data = await res.json();
        setNodes((prev) => ({ ...prev, [path]: { entries: data.files ?? [], loading: false, expanded: true } }));
      } catch {
        setNodes((prev) => ({ ...prev, [path]: { entries: [], loading: false, expanded: true } }));
      }
    },
    [repositoryId],
  );

  React.useEffect(() => {
    queueMicrotask(() => loadDir(""));
  }, [loadDir]);

  function toggleDir(path: string) {
    const node = nodes[path];
    if (!node || !node.entries) {
      loadDir(path);
      return;
    }
    setNodes((prev) => ({ ...prev, [path]: { ...prev[path], expanded: !prev[path].expanded } }));
  }

  function renderEntries(path: string, depth: number) {
    const node = nodes[path];
    if (!node) return null;
    if (node.loading && !node.entries) {
      return (
        <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground" style={{ paddingLeft: depth * 12 + 24 }}>
          <Loader2 className="size-3 animate-spin" /> Loading…
        </div>
      );
    }
    const entries = (node.entries ?? []).filter((e) => !filter || e.name.toLowerCase().includes(filter.toLowerCase()));
    return entries.map((entry) => {
      if (entry.type === "dir") {
        const childNode = nodes[entry.path];
        return (
          <div key={entry.path}>
            <button
              onClick={() => toggleDir(entry.path)}
              className="flex w-full items-center gap-1.5 rounded py-1 pr-2 text-left text-sm hover:bg-accent"
              style={{ paddingLeft: depth * 12 + 4 }}
            >
              {childNode?.expanded ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />}
              {childNode?.expanded ? (
                <FolderOpenIcon className="size-4 shrink-0 text-blue-400" />
              ) : (
                <FolderIcon className="size-4 shrink-0 text-blue-400" />
              )}
              <span className="truncate">{entry.name}</span>
            </button>
            {childNode?.expanded && renderEntries(entry.path, depth + 1)}
          </div>
        );
      }
      const Icon = iconForFile(entry.name);
      const active = selectedPath === entry.path;
      return (
        <button
          key={entry.path}
          onClick={() => onSelect(entry.path)}
          className={cn(
            "flex w-full items-center gap-1.5 rounded py-1 pr-2 text-left text-sm hover:bg-accent",
            active && "bg-accent",
          )}
          style={{ paddingLeft: depth * 12 + 22 }}
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{entry.name}</span>
        </button>
      );
    });
  }

  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center gap-1.5 border-b p-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search files"
            className="h-7 pl-7 text-xs"
          />
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => loadDir("")} aria-label="Refresh">
          <RefreshCw className="size-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">{renderEntries("", 0)}</div>
    </div>
  );
}
