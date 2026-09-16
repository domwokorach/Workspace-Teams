"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Loader2, Clock, Ban, RotateCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ResizableSplit } from "@/components/layout/resizable-workspace";
import { useBreakpoint } from "@/hooks/use-breakpoint";

interface WorkflowRun {
  id: number;
  name: string;
  branch: string;
  commitSha: string;
  status: "queued" | "running" | "passed" | "failed" | "cancelled";
  startedAt: string;
  updatedAt: string;
  htmlUrl: string;
  event: string;
}

interface Job {
  id: number;
  name: string;
  status: "queued" | "running" | "passed" | "failed" | "cancelled";
  startedAt: string | null;
  completedAt: string | null;
  steps: { name: string; status: string; number: number }[];
  htmlUrl: string;
}

const STATUS_CONFIG: Record<WorkflowRun["status"], { icon: React.ElementType; label: string; className: string }> = {
  queued: { icon: Clock, label: "Queued", className: "bg-muted text-muted-foreground" },
  running: { icon: Loader2, label: "Running", className: "bg-blue-500/15 text-blue-500" },
  passed: { icon: CheckCircle2, label: "Passed", className: "bg-emerald-500/15 text-emerald-500" },
  failed: { icon: XCircle, label: "Failed", className: "bg-red-500/15 text-red-500" },
  cancelled: { icon: Ban, label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

function RunDetails({ run, jobs }: { run: WorkflowRun; jobs: Job[] | undefined }) {
  const config = STATUS_CONFIG[run.status];
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-start gap-3 border-b p-4">
        <Badge className={config.className}>
          <config.icon className={`size-3 ${run.status === "running" ? "animate-spin" : ""}`} />
          {config.label}
        </Badge>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{run.name}</p>
          <p className="text-xs text-muted-foreground">
            {run.branch} · {run.commitSha.slice(0, 7)} · {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
          </p>
        </div>
        <a href={run.htmlUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="size-3.5 text-muted-foreground" />
        </a>
      </div>
      <div className="space-y-2 p-4">
        {jobs === undefined ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No job details available.</p>
        ) : (
          jobs.map((job) => {
            const jobConfig = STATUS_CONFIG[job.status];
            return (
              <div key={job.id} className="rounded-md border bg-background p-2.5 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <jobConfig.icon className={`size-3.5 ${jobConfig.className.split(" ")[1]}`} />
                  {job.name}
                </p>
                <ul className="mt-1.5 space-y-1 pl-5 font-mono text-xs text-muted-foreground">
                  {job.steps.map((step) => (
                    <li key={step.number} className="flex items-center gap-1.5">
                      {step.status === "completed" ? "✓" : step.status === "in_progress" ? "…" : "○"} {step.name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function WorkflowRunList({ repositoryId }: { repositoryId: string }) {
  const [runs, setRuns] = React.useState<WorkflowRun[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [jobs, setJobs] = React.useState<Record<number, Job[]>>({});
  const breakpoint = useBreakpoint();

  const loadJobs = React.useCallback(
    async (runId: number) => {
      const res = await fetch(`/api/repositories/${repositoryId}/workflow-runs/${runId}/jobs`);
      const data = await res.json();
      setJobs((prev) => ({ ...prev, [runId]: data.jobs ?? [] }));
    },
    [repositoryId],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/repositories/${repositoryId}/workflow-runs`);
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed to load CI runs.");
    else {
      const loadedRuns: WorkflowRun[] = data.runs ?? [];
      setRuns(loadedRuns);
      setSelected((prev) => {
        const nextId = prev ?? loadedRuns[0]?.id ?? null;
        if (nextId !== null) loadJobs(nextId);
        return nextId;
      });
    }
    setLoading(false);
  }, [repositoryId, loadJobs]);

  React.useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const selectRun = React.useCallback(
    (run: WorkflowRun) => {
      setSelected(run.id);
      if (!jobs[run.id]) loadJobs(run.id);
    },
    [jobs, loadJobs],
  );

  async function handleRerun(runId: number, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/repositories/${repositoryId}/workflow-runs/${runId}/rerun`, { method: "POST" });
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{error}</p>;
  }

  const passed = runs.filter((r) => r.status === "passed").length;
  const failed = runs.filter((r) => r.status === "failed").length;
  const selectedRun = runs.find((r) => r.id === selected) ?? null;

  const explorer = (
    <div className="flex h-full flex-col overflow-hidden border-r">
      <div className="flex shrink-0 items-center gap-4 border-b p-3 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-emerald-500">
          <CheckCircle2 className="size-4" /> {passed}
        </span>
        <span className="flex items-center gap-1.5 font-medium text-red-500">
          <XCircle className="size-4" /> {failed}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {runs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No workflow runs found.</p>
        ) : (
          <div className="divide-y">
            {runs.map((run) => {
              const config = STATUS_CONFIG[run.status];
              return (
                <button
                  key={run.id}
                  onClick={() => selectRun(run)}
                  className={cn(
                    "flex w-full items-center gap-2.5 p-3 text-left hover:bg-accent/50",
                    selected === run.id && "bg-accent",
                  )}
                >
                  <config.icon className={cn("size-4 shrink-0", config.className.split(" ")[1], run.status === "running" && "animate-spin")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{run.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {run.branch} · {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button size="icon-sm" variant="ghost" onClick={(e) => handleRerun(run.id, e)} aria-label="Re-run">
                    <RotateCw className="size-3.5" />
                  </Button>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const details = selectedRun ? (
    <RunDetails run={selectedRun} jobs={jobs[selectedRun.id]} />
  ) : (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a run to view details</div>
  );

  if (breakpoint !== "desktop") {
    return (
      <div className="flex h-full min-h-[32rem] flex-col">
        <div className="h-64 shrink-0 overflow-hidden border-b">{explorer}</div>
        <div className="min-h-0 flex-1">{details}</div>
      </div>
    );
  }

  return (
    <ResizableSplit
      storageId="workspace.tests"
      orientation="horizontal"
      panes={[
        { id: "explorer", content: explorer, defaultSize: 32, minSize: 20, maxSize: 45 },
        { id: "details", content: details, defaultSize: 68, minSize: 40 },
      ]}
    />
  );
}
