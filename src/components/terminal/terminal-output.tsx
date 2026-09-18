"use client";

import { useEffect, useRef } from "react";
import { TerminalSquare } from "lucide-react";
import { AnimatedSpan } from "@/components/ui/terminal";
import { cn } from "@/lib/utils";
import { tokenizeCommand } from "./utils";
import type { TerminalEntry, TerminalLineKind } from "./types";

const LINE_KIND_CLASS: Record<TerminalLineKind, string> = {
  stdout: "text-foreground/75",
  stderr: "text-red-500 dark:text-red-400",
  success: "text-emerald-600 dark:text-emerald-400",
  info: "text-sky-600 dark:text-sky-400",
};

function CommandLine({ command, animate }: { command: string; animate: boolean }) {
  const tokens = tokenizeCommand(command);
  const content = (
    <span className="flex flex-wrap items-baseline gap-x-1.5">
      <span className="select-none text-emerald-600 dark:text-emerald-400" aria-hidden="true">
        $
      </span>
      {tokens.map((token, index) => (
        <span
          key={index}
          className={cn(
            "whitespace-pre",
            token.kind === "bin" && "font-medium text-sky-600 dark:text-sky-400",
            token.kind === "flag" && "text-muted-foreground",
            token.kind === "arg" && "text-foreground"
          )}
        >
          {token.text}
        </span>
      ))}
    </span>
  );

  if (!animate) {
    return <div className="grid text-sm">{content}</div>;
  }

  return <AnimatedSpan className="text-sm">{content}</AnimatedSpan>;
}

function OutputLine({
  kind,
  content,
  animate,
}: {
  kind: TerminalLineKind;
  content: string;
  animate: boolean;
}) {
  const text = <span className="whitespace-pre-wrap">{content}</span>;

  if (!animate) {
    return <div className={cn("grid pl-4 text-sm", LINE_KIND_CLASS[kind])}>{text}</div>;
  }

  return (
    <AnimatedSpan className={cn("pl-4 text-sm", LINE_KIND_CLASS[kind])}>{text}</AnimatedSpan>
  );
}

interface TerminalOutputProps {
  entries: TerminalEntry[];
  animateInitial?: boolean;
}

export function TerminalOutput({ entries, animateInitial = false }: TerminalOutputProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div
        role="status"
        className="flex h-full min-h-40 flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground"
      >
        <TerminalSquare className="size-6 opacity-50" aria-hidden="true" />
        <p className="text-sm">No output yet</p>
        <p className="text-xs">Run a command below to get started.</p>
      </div>
    );
  }

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Terminal output"
      className="h-full overflow-y-auto px-3.5 py-3 font-mono sm:px-4"
    >
      <div className="grid gap-y-2.5">
        {entries.map((entry, entryIndex) => {
          const animate = animateInitial && entryIndex === 0;
          return (
            <div key={entry.id} className="grid gap-y-1">
              <CommandLine command={entry.command} animate={animate} />
              {entry.output.map((line) => (
                <OutputLine key={line.id} kind={line.kind} content={line.content} animate={animate} />
              ))}
            </div>
          );
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
