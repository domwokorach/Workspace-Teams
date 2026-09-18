"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TerminalHeader } from "./terminal-header";
import { TerminalOutput } from "./terminal-output";
import { TerminalInput } from "./terminal-input";
import { createEntry } from "./utils";
import type { TerminalConnectionState, TerminalEntry } from "./types";

function seedEntries(): TerminalEntry[] {
  return [
    createEntry("pnpm install"),
    createEntry("pnpm dev"),
    createEntry("git status"),
    createEntry("npm run build"),
  ];
}

interface WorkspaceTerminalProps {
  title?: string;
  connectionState?: TerminalConnectionState;
  className?: string;
}

export function WorkspaceTerminal({
  title = "workspace-terminal",
  connectionState = "connected",
  className,
}: WorkspaceTerminalProps) {
  const [entries, setEntries] = useState<TerminalEntry[]>(() => seedEntries());
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [hasAnimatedInitial, setHasAnimatedInitial] = useState(true);

  const history = useMemo(() => entries.map((entry) => entry.command), [entries]);

  const handleSubmit = useCallback((command: string) => {
    setHasAnimatedInitial(false);
    setEntries((prev) => [...prev, createEntry(command)]);
  }, []);

  const handleClear = useCallback(() => {
    setEntries([]);
    setHasAnimatedInitial(false);
  }, []);

  const handleCopy = useCallback(() => {
    const last = entries.at(-1);
    if (!last) {
      toast.error("Nothing to copy yet");
      return;
    }
    navigator.clipboard
      .writeText(last.command)
      .then(() => toast.success("Command copied to clipboard"))
      .catch(() => toast.error("Couldn't copy command"));
  }, [entries]);

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm transition-[height] duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none",
        minimized ? "h-12" : maximized ? "h-[70vh] max-h-[720px]" : "h-[26rem] max-h-[70vh]",
        className
      )}
    >
      <TerminalHeader
        title={title}
        connectionState={connectionState}
        minimized={minimized}
        maximized={maximized}
        onCopy={handleCopy}
        onClear={handleClear}
        onToggleMinimize={() => setMinimized((v) => !v)}
        onToggleMaximize={() => setMaximized((v) => !v)}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 bg-background">
          <TerminalOutput entries={entries} animateInitial={hasAnimatedInitial} />
        </div>
        <TerminalInput onSubmit={handleSubmit} onClear={handleClear} history={history} />
      </div>
    </div>
  );
}
