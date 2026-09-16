"use client";

import * as React from "react";
import { Plus, X, TerminalSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TerminalTab {
  id: string;
  label: string;
  lines: string[];
}

function TerminalPane() {
  const [terminals, setTerminals] = React.useState<TerminalTab[]>([
    { id: "1", label: "Terminal 1", lines: ["$ git status", "", "On branch main", "Your branch is up to date with 'origin/main'.", "", "nothing to commit, working tree clean"] },
  ]);
  const [active, setActive] = React.useState("1");
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});

  function addTerminal() {
    const id = String(terminals.length + 1 + Math.random());
    const label = `Terminal ${terminals.length + 1}`;
    setTerminals((prev) => [...prev, { id, label, lines: [] }]);
    setActive(id);
  }

  function closeTerminal(id: string) {
    setTerminals((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (active === id) setActive(next.at(-1)?.id ?? "");
      return next;
    });
  }

  function runCommand(id: string) {
    const cmd = drafts[id]?.trim();
    if (!cmd) return;
    setTerminals((prev) =>
      prev.map((t) => (t.id === id ? { ...t, lines: [...t.lines, `$ ${cmd}`, `${cmd}: command not found (sandboxed terminal)`] } : t)),
    );
    setDrafts((prev) => ({ ...prev, [id]: "" }));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b bg-muted/20 px-1.5 py-1">
        {terminals.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "group flex items-center gap-1.5 rounded px-2 py-1 text-xs",
              active === t.id ? "bg-background" : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            <TerminalSquare className="size-3" />
            {t.label}
            <X
              className="size-3 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                closeTerminal(t.id);
              }}
            />
          </button>
        ))}
        <Button variant="ghost" size="icon-sm" onClick={addTerminal} aria-label="New terminal">
          <Plus className="size-3.5" />
        </Button>
      </div>
      {terminals.map((t) => (
        <div
          key={t.id}
          className={cn("min-h-0 flex-1 overflow-y-auto p-2 font-mono text-xs", active !== t.id && "hidden")}
        >
          {t.lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}
          <div className="flex items-center gap-1">
            <span>$</span>
            <input
              value={drafts[t.id] ?? ""}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && runCommand(t.id)}
              className="min-w-0 flex-1 bg-transparent outline-none"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface ProblemItem {
  file: string;
  line: number;
  message: string;
  severity: "error" | "warning";
}

export interface BottomPanelProps {
  problems?: ProblemItem[];
  output?: string[];
  className?: string;
}

export function BottomPanel({ problems = [], output = [], className }: BottomPanelProps) {
  const errorCount = problems.filter((p) => p.severity === "error").length;

  return (
    <Tabs defaultValue="terminal" className={cn("flex h-full min-h-0 w-full flex-col gap-0", className)}>
      <TabsList variant="line" className="h-8 shrink-0 justify-start rounded-none border-b bg-muted/10 px-2">
        <TabsTrigger value="terminal">Terminal</TabsTrigger>
        <TabsTrigger value="problems" className="gap-1.5">
          Problems
          {problems.length > 0 && (
            <Badge variant={errorCount > 0 ? "destructive" : "secondary"} className="h-4 min-w-4 px-1 text-[10px]">
              {problems.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="output">Output</TabsTrigger>
        <TabsTrigger value="debug">Debug Console</TabsTrigger>
        <TabsTrigger value="tests">Tests</TabsTrigger>
        <TabsTrigger value="git">Git</TabsTrigger>
      </TabsList>

      <TabsContent value="terminal" className="min-h-0 flex-1 overflow-hidden">
        <TerminalPane />
      </TabsContent>

      <TabsContent value="problems" className="min-h-0 flex-1 overflow-y-auto p-2 text-xs">
        {problems.length === 0 ? (
          <p className="p-2 text-muted-foreground">No problems detected in the workspace.</p>
        ) : (
          <ul className="space-y-1">
            {problems.map((p, i) => (
              <li key={i} className="flex items-start gap-2 rounded px-1.5 py-1 hover:bg-accent/50">
                <span className={cn("mt-0.5 size-1.5 shrink-0 rounded-full", p.severity === "error" ? "bg-destructive" : "bg-amber-500")} />
                <span className="font-mono text-muted-foreground">{p.file}:{p.line}</span>
                <span>{p.message}</span>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="output" className="min-h-0 flex-1 overflow-y-auto p-2 font-mono text-xs">
        {output.length === 0 ? (
          <p className="text-muted-foreground">No output yet.</p>
        ) : (
          output.map((line, i) => <div key={i}>{line}</div>)
        )}
      </TabsContent>

      <TabsContent value="debug" className="min-h-0 flex-1 overflow-y-auto p-2 font-mono text-xs text-muted-foreground">
        No active debug session.
      </TabsContent>

      <TabsContent value="tests" className="min-h-0 flex-1 overflow-y-auto p-2 font-mono text-xs">
        <div className="text-emerald-500">✓ auth.test.ts</div>
        <div className="text-emerald-500">✓ github.test.ts</div>
        <div className="text-emerald-500">✓ repository.test.ts</div>
        <p className="mt-2 text-muted-foreground">42 passed</p>
      </TabsContent>

      <TabsContent value="git" className="min-h-0 flex-1 overflow-y-auto p-2 text-xs text-muted-foreground">
        Use the Git panel on the right for branch, staging, and commit actions.
      </TabsContent>
    </Tabs>
  );
}
