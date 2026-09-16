"use client";

import * as React from "react";
import { Loader2, GitMerge, XCircle, CheckCircle2, MessageCircle, GitCommit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { PullRequestFiles } from "./pull-request-files";
import type { GitHubPullRequestSummary } from "@/types/github";

interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
}

interface CommitRow {
  sha: string;
  message: string;
  authorName: string;
  committedAt: string;
}

interface Review {
  id: number;
  state: string;
  body: string | null;
  reviewer: { login: string } | null;
  submittedAt: string | null;
}

export function PullRequestDetail({ repositoryId, number }: { repositoryId: string; number: number }) {
  const [pr, setPr] = React.useState<GitHubPullRequestSummary | null>(null);
  const [files, setFiles] = React.useState<FileChange[]>([]);
  const [commits, setCommits] = React.useState<CommitRow[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [reviewBody, setReviewBody] = React.useState("");
  const [actionError, setActionError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/repositories/${repositoryId}/pull-requests/${number}`);
    const data = await res.json();
    if (res.ok) {
      setPr(data.pullRequest);
      setFiles(data.files ?? []);
      setCommits(data.commits ?? []);
      setReviews(data.reviews ?? []);
    }
    setLoading(false);
  }, [repositoryId, number]);

  React.useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function submitReview(event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT") {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/repositories/${repositoryId}/pull-requests/${number}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, body: reviewBody || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error ?? "Failed to submit review.");
      } else {
        setReviewBody("");
        load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleMerge(method: "merge" | "squash" | "rebase") {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/repositories/${repositoryId}/pull-requests/${number}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error ?? "Failed to merge.");
      } else {
        load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    setBusy(true);
    try {
      await fetch(`/api/repositories/${repositoryId}/pull-requests/${number}/close`, { method: "POST" });
      load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pr) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Pull request not found.</p>;
  }

  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          {pr.title} <span className="font-normal text-muted-foreground">#{number}</span>
        </h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {pr.sourceBranch} → {pr.targetBranch}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pr.merged ? (
            <Badge className="bg-purple-500/15 text-purple-500"><GitMerge className="size-3" /> Merged</Badge>
          ) : pr.state === "closed" ? (
            <Badge className="bg-red-500/15 text-red-500"><XCircle className="size-3" /> Closed</Badge>
          ) : (
            <Badge className="bg-emerald-500/15 text-emerald-500"><CheckCircle2 className="size-3" /> Open</Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {files.length} files changed · <span className="text-emerald-500">+{totalAdditions}</span>{" "}
            <span className="text-red-500">-{totalDeletions}</span>
          </span>
        </div>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {!pr.merged && pr.state === "open" && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <Textarea
            placeholder="Leave a review comment (optional)…"
            value={reviewBody}
            onChange={(e) => setReviewBody(e.target.value)}
            className="min-h-16 flex-1"
          />
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={() => submitReview("APPROVE")} disabled={busy}>Approve</Button>
            <Button size="sm" variant="outline" onClick={() => submitReview("REQUEST_CHANGES")} disabled={busy}>
              Request changes
            </Button>
            <Button size="sm" variant="ghost" onClick={() => submitReview("COMMENT")} disabled={busy}>
              <MessageCircle /> Comment
            </Button>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="sm" disabled={busy} />}>
                <GitMerge /> Merge
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => handleMerge("merge")}>Create a merge commit</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleMerge("squash")}>Squash and merge</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleMerge("rebase")}>Rebase and merge</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" onClick={handleClose} disabled={busy}>Close</Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="conversation">
        <TabsList>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="commits">Commits ({commits.length})</TabsTrigger>
          <TabsTrigger value="checks">Checks</TabsTrigger>
          <TabsTrigger value="files">Files Changed ({files.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="conversation" className="space-y-3">
          {pr.body && (
            <Card>
              <CardContent className="whitespace-pre-wrap p-4 text-sm">{pr.body}</CardContent>
            </Card>
          )}
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-1 p-4">
                <p className="text-sm">
                  <span className="font-medium">{r.reviewer?.login ?? "Unknown"}</span>{" "}
                  <span className="text-muted-foreground">
                    {r.state === "APPROVED" ? "approved these changes" : r.state === "CHANGES_REQUESTED" ? "requested changes" : "commented"}
                  </span>
                </p>
                {r.body && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{r.body}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="commits" className="space-y-2">
          {commits.map((c) => (
            <div key={c.sha} className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
              <GitCommit className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{c.message.split("\n")[0]}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{c.sha.slice(0, 7)}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(c.committedAt), { addSuffix: true })}
              </span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="checks">
          <p className="py-8 text-center text-sm text-muted-foreground">
            See the <a href="/tests" className="underline">Tests / CI</a> tab for full workflow status.
          </p>
        </TabsContent>

        <TabsContent value="files">
          <PullRequestFiles files={files} reviews={reviews} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
