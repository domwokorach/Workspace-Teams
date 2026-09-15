"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GitHubRepoSummary } from "@/types/github";
import type { ImportStage } from "@/types/import";

const STAGES: { key: ImportStage; label: string }[] = [
  { key: "authenticating", label: "Authenticating GitHub" },
  { key: "fetching_repository", label: "Fetching repository" },
  { key: "loading_branches", label: "Loading branches" },
  { key: "loading_files", label: "Loading files" },
  { key: "loading_issues", label: "Loading issues" },
  { key: "loading_pull_requests", label: "Loading pull requests" },
  { key: "loading_contributors", label: "Loading contributors" },
  { key: "loading_ci", label: "Loading CI information" },
  { key: "ready", label: "Workspace ready" },
];

export function ImportRepositoryDialog({
  repo,
  onClose,
}: {
  repo: GitHubRepoSummary | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [currentStage, setCurrentStage] = React.useState<ImportStage | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [repositoryId, setRepositoryId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!repo) {
      queueMicrotask(() => {
        setCurrentStage(null);
        setError(null);
        setRepositoryId(null);
      });
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/github/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner: repo.owner, repo: repo.name }),
          signal: controller.signal,
        });

        if (!res.body) throw new Error("No response stream.");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";
          for (const chunk of chunks) {
            const line = chunk.replace(/^data: /, "").trim();
            if (!line) continue;
            const event = JSON.parse(line);
            if (event.type === "progress") setCurrentStage(event.stage);
            if (event.type === "complete") {
              setCurrentStage("ready");
              setRepositoryId(event.repositoryId);
            }
            if (event.type === "error") setError(event.message);
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Import failed.");
        }
      }
    })();

    return () => controller.abort();
  }, [repo]);

  const currentIndex = currentStage ? STAGES.findIndex((s) => s.key === currentStage) : -1;

  function handleOpenWorkspace() {
    if (repositoryId) {
      router.push(`/repositories/${repositoryId}`);
      router.refresh();
    }
    onClose();
  }

  return (
    <Dialog open={!!repo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importing {repo?.fullName}</DialogTitle>
          <DialogDescription>Creating your engineering workspace from GitHub.</DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <ul className="space-y-2 py-2">
            {STAGES.map((stage, i) => {
              const done = currentIndex > i || (currentIndex === i && stage.key === "ready");
              const active = currentIndex === i && stage.key !== "ready";
              return (
                <li key={stage.key} className="flex items-center gap-2.5 text-sm">
                  {done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  ) : active ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className={cn(!done && !active && "text-muted-foreground")}>{stage.label}</span>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {currentStage === "ready" ? "Close" : "Cancel"}
          </Button>
          <Button onClick={handleOpenWorkspace} disabled={currentStage !== "ready" || !repositoryId}>
            Open workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
