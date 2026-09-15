import "server-only";
import { getOctokit, withGitHubErrorHandling } from "./client";

function mapStatus(status: string, conclusion: string | null): "queued" | "running" | "passed" | "failed" | "cancelled" {
  if (status === "queued" || status === "waiting" || status === "pending") return "queued";
  if (status === "in_progress") return "running";
  if (conclusion === "success") return "passed";
  if (conclusion === "cancelled" || conclusion === "skipped") return "cancelled";
  return "failed";
}

export async function listWorkflowRuns(
  userId: string,
  owner: string,
  repo: string,
  opts: { branch?: string; perPage?: number } = {},
) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      branch: opts.branch,
      per_page: opts.perPage ?? 20,
    });
    return res.data.workflow_runs.map((run) => ({
      id: run.id,
      name: run.name ?? run.display_title,
      branch: run.head_branch ?? "",
      commitSha: run.head_sha,
      status: mapStatus(run.status ?? "queued", run.conclusion),
      startedAt: run.run_started_at ?? run.created_at,
      updatedAt: run.updated_at,
      htmlUrl: run.html_url,
      event: run.event,
    }));
  });
}

export async function getWorkflowRunJobs(userId: string, owner: string, repo: string, runId: number) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.actions.listJobsForWorkflowRun({ owner, repo, run_id: runId });
    return res.data.jobs.map((job) => ({
      id: job.id,
      name: job.name,
      status: mapStatus(job.status, job.conclusion),
      startedAt: job.started_at,
      completedAt: job.completed_at,
      steps: (job.steps ?? []).map((s) => ({
        name: s.name,
        status: mapStatus(s.status, s.conclusion),
        number: s.number,
      })),
      htmlUrl: job.html_url,
    }));
  });
}

export async function rerunWorkflow(userId: string, owner: string, repo: string, runId: number) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    await octokit.actions.reRunWorkflow({ owner, repo, run_id: runId });
  });
}

export async function listCheckRunsForRef(userId: string, owner: string, repo: string, ref: string) {
  const octokit = await getOctokit(userId);
  return withGitHubErrorHandling(async () => {
    const res = await octokit.checks.listForRef({ owner, repo, ref, per_page: 50 });
    return res.data.check_runs.map((run) => ({
      name: run.name,
      status: run.status as "queued" | "in_progress" | "completed",
      conclusion: run.conclusion,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      detailsUrl: run.details_url ?? null,
    }));
  });
}
