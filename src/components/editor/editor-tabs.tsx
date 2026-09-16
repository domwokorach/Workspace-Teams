"use client";

import { X, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EditorTab {
  path: string;
  dirty: boolean;
}

export function EditorTabs({
  tabs,
  activePath,
  onSelect,
  onClose,
}: {
  tabs: EditorTab[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex shrink-0 overflow-x-auto border-b bg-muted/10">
      {tabs.map((t) => (
        <button
          key={t.path}
          onClick={() => onSelect(t.path)}
          className={cn(
            "group flex shrink-0 items-center gap-1.5 border-r px-3 py-1.5 text-xs",
            activePath === t.path ? "bg-background" : "text-muted-foreground hover:bg-accent/50",
          )}
        >
          <span className="max-w-40 truncate font-mono">{t.path.split("/").pop()}</span>
          {t.dirty ? (
            <Circle className="size-2 shrink-0 fill-current text-primary" />
          ) : (
            <X
              className="size-3 shrink-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onClose(t.path);
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
