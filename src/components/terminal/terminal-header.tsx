"use client";

import { motion } from "motion/react";
import { Copy, Maximize2, Minimize2, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TerminalConnectionState } from "./types";

const STATUS_LABEL: Record<TerminalConnectionState, string> = {
  connected: "Connected",
  connecting: "Connecting…",
  disconnected: "Disconnected",
};

const STATUS_DOT: Record<TerminalConnectionState, string> = {
  connected: "bg-emerald-500",
  connecting: "bg-amber-500",
  disconnected: "bg-red-500",
};

interface TerminalHeaderProps {
  title: string;
  connectionState: TerminalConnectionState;
  minimized: boolean;
  maximized: boolean;
  onCopy: () => void;
  onClear: () => void;
  onToggleMinimize: () => void;
  onToggleMaximize: () => void;
}

function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function TerminalHeader({
  title,
  connectionState,
  minimized,
  maximized,
  onCopy,
  onClear,
  onToggleMinimize,
  onToggleMaximize,
}: TerminalHeaderProps) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border/60 bg-muted/40 px-3.5 sm:px-4">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-red-500/80" />
        <span className="size-2.5 rounded-full bg-yellow-500/80" />
        <span className="size-2.5 rounded-full bg-green-500/80" />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-mono text-xs font-medium text-foreground sm:text-sm">
          {title}
        </span>

        <span className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
          <span className="relative flex size-1.5">
            {connectionState === "connected" && (
              <motion.span
                className={cn("absolute inline-flex size-full rounded-full", STATUS_DOT[connectionState])}
                animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.8, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <span className={cn("relative inline-flex size-1.5 rounded-full", STATUS_DOT[connectionState])} />
          </span>
          {STATUS_LABEL[connectionState]}
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        <HeaderIconButton label="Copy last command" onClick={onCopy}>
          <Copy />
        </HeaderIconButton>
        <HeaderIconButton label="Clear terminal" onClick={onClear}>
          <Trash2 />
        </HeaderIconButton>
        <HeaderIconButton
          label={minimized ? "Expand terminal" : "Minimize terminal"}
          onClick={onToggleMinimize}
        >
          <Minus />
        </HeaderIconButton>
        <HeaderIconButton
          label={maximized ? "Restore terminal" : "Maximize terminal"}
          onClick={onToggleMaximize}
        >
          {maximized ? <Minimize2 /> : <Maximize2 />}
        </HeaderIconButton>
      </div>
    </div>
  );
}
