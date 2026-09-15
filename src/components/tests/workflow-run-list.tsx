"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Loader2, Clock, Ban, RotateCw, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

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

export function WorkflowRunList({ repositoryId }: { repositoryId: string }) {
  const [runs, setRuns] = React.useState<WorkflowRun[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<number | null>(null);
  const [jobs, setJobs] = React.useState<Record<number, Job[]>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/repositories/${repositoryId}/workflow-runs`);
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed to load CI runs.");
    else setRuns(data.runs ?? []);
    setLoading(false);
  }, [repositoryId]);

  React.useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function toggleExpand(run: WorkflowRun) {
    if (expanded === run.id) {
      setExpanded(null);
      return;
    }
    setExpanded(run.id);
    if (!jobs[run.id]) {
      const res = await fetch(`/api/repositories/${repositoryId}/workflow-runs/${run.id}/jobs`);
      const data = await res.json();
      setJobs((prev) => ({ ...prev, [run.id]: data.jobs ?? [] }));
    }
  }

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-lg border p-3 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-emerald-500">
          <CheckCircle2 className="size-4" /> {passed} passed
        </span>
        <span className="flex items-center gap-1.5 font-medium text-red-500">
          <XCircle className="size-4" /> {failed} failed
        </span>
      </div>

      {runs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No workflow runs found.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {runs.map((run) => {
            const config = STATUS_CONFIG[run.status];
            const isExpanded = expanded === run.id;
            return (
              <div key={run.id}>
                <button
                  onClick={() => toggleExpand(run)}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-accent/50"
                >
                  {isExpanded ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
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
                  <Button size="icon-sm" variant="ghost" onClick={(e) => handleRerun(run.id, e)} aria-label="Re-run">
                    <RotateCw className="size-3.5" />
                  </Button>
                  <a href={run.htmlUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="size-3.5 text-muted-foreground" />
                  </a>
                </button>
                {isExpanded && (
                  <div className="space-y-2 border-t bg-muted/20 p-3">
                    {(jobs[run.id] ?? []).map((job) => {
                      const jobConfig = STATUS_CONFIG[job.status];
                      return (
                        <div key={job.id} className="rounded-md border bg-background p-2.5 text-sm">
                          <p className="flex items-center gap-2 font-medium">
                            <jobConfig.icon className={`size-3.5 ${jobConfig.className.split(" ")[1]}`} />
                            {job.name}
                          </p>
                          <ul className="mt-1.5 space-y-1 pl-5">
                            {job.steps.map((step) => (
                              <li key={step.number} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                {step.status === "completed" ? "✓" : step.status === "in_progress" ? "…" : "○"} {step.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
