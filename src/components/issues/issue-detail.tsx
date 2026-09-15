"use client";

import * as React from "react";
import { CircleDot, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import type { GitHubIssueSummary } from "@/types/github";

interface Comment {
  id: number;
  body: string;
  author: { login: string; avatarUrl: string } | null;
  createdAt: string;
}

export function IssueDetail({ repositoryId, number }: { repositoryId: string; number: number }) {
  const [issue, setIssue] = React.useState<GitHubIssueSummary | null>(null);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [newComment, setNewComment] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [updatingState, setUpdatingState] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/repositories/${repositoryId}/issues/${number}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load issue.");
    } else {
      setIssue(data.issue);
      setComments(data.comments ?? []);
    }
    setLoading(false);
  }, [repositoryId, number]);

  React.useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function handleToggleState() {
    if (!issue) return;
    setUpdatingState(true);
    try {
      await fetch(`/api/repositories/${repositoryId}/issues/${number}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: issue.state === "open" ? "closed" : "open" }),
      });
      load();
    } finally {
      setUpdatingState(false);
    }
  }

  async function handleComment() {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await fetch(`/api/repositories/${repositoryId}/issues/${number}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment }),
      });
      setNewComment("");
      load();
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !issue) {
    return <p className="py-16 text-center text-sm text-muted-foreground">{error ?? "Issue not found."}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          {issue.title} <span className="font-normal text-muted-foreground">#{number}</span>
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className={issue.state === "open" ? "bg-emerald-500/15 text-emerald-500" : "bg-purple-500/15 text-purple-500"}>
            {issue.state === "open" ? <CircleDot className="size-3" /> : <CheckCircle2 className="size-3" />}
            {issue.state === "open" ? "Open" : "Closed"}
          </Badge>
          {issue.author && (
            <span className="text-sm text-muted-foreground">
              {issue.author.login} opened this issue {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
            </span>
          )}
          <Button size="sm" variant="outline" className="ml-auto" onClick={handleToggleState} disabled={updatingState}>
            {updatingState && <Loader2 className="size-3.5 animate-spin" />}
            {issue.state === "open" ? "Close issue" : "Reopen issue"}
          </Button>
        </div>
        {issue.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {issue.labels.map((l) => (
              <Badge key={l.name} variant="secondary">{l.name}</Badge>
            ))}
          </div>
        )}
      </div>

      {issue.body && (
        <Card>
          <CardContent className="whitespace-pre-wrap p-4 text-sm">{issue.body}</CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{comments.length} comments</p>
        {comments.map((c) => (
          <Card key={c.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarImage src={c.author?.avatarUrl} />
                  <AvatarFallback className="text-[10px]">{c.author?.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{c.author?.login ?? "Unknown"}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{c.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Leave a comment…"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-24"
        />
        <Button onClick={handleComment} disabled={!newComment.trim() || posting}>
          {posting && <Loader2 className="size-4 animate-spin" />}
          Comment
        </Button>
      </div>
    </div>
  );
}
