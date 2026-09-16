"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, CircleDot, CheckCircle2, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface IssueRow {
  id: string;
  number: number;
  title: string;
  state: "OPEN" | "CLOSED";
  labels: string[];
  commentsCount: number;
  updatedAt: string;
  author: { firstName: string; lastName: string; avatarUrl: string | null } | null;
  assignees: { id: string; firstName: string; lastName: string; avatarUrl: string | null }[];
}

const TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned to Me" },
  { value: "created", label: "Created by Me" },
  { value: "closed", label: "Closed" },
];

export function IssueList({
  repositoryId,
  onSelect,
  selectedNumber,
}: {
  repositoryId: string;
  currentUserId: string;
  /** When provided, clicking an issue calls this instead of navigating via Link (used by the master/detail workspace). */
  onSelect?: (number: number) => void;
  selectedNumber?: number | null;
}) {
  const [tab, setTab] = React.useState("open");
  const [issues, setIssues] = React.useState<IssueRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab === "open") params.set("state", "open");
    if (tab === "closed") params.set("state", "closed");
    if (tab === "assigned") params.set("assignedToMe", "1");
    if (tab === "created") params.set("createdByMe", "1");

    const res = await fetch(`/api/repositories/${repositoryId}/issues?${params.toString()}`);
    const data = await res.json();
    setIssues(data.issues ?? []);
    setLoading(false);
  }, [repositoryId, tab]);

  React.useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await fetch(`/api/repositories/${repositoryId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      setCreateOpen(false);
      setTitle("");
      setBody("");
      load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus /> New issue
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-lg border py-16 text-center text-sm text-muted-foreground">
          No issues found for this view.
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {issues.map((issue) => {
            const active = selectedNumber === issue.number;
            const inner = (
              <>
                {issue.state === "OPEN" ? (
                  <CircleDot className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-purple-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {issue.title} <span className="font-normal text-muted-foreground">#{issue.number}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {issue.labels.map((l) => (
                      <Badge key={l} variant="secondary" className="text-[10px]">
                        {l}
                      </Badge>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      opened {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
                      {issue.author && ` by ${issue.author.firstName} ${issue.author.lastName}`}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {issue.assignees.length > 0 && (
                    <div className="flex -space-x-1.5">
                      {issue.assignees.slice(0, 3).map((a) => (
                        <Avatar key={a.id} className="size-5 border-2 border-background">
                          <AvatarImage src={a.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-[9px]">{a.firstName[0]}{a.lastName[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  )}
                  {issue.commentsCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="size-3.5" /> {issue.commentsCount}
                    </span>
                  )}
                </div>
              </>
            );

            if (onSelect) {
              return (
                <button
                  key={issue.id}
                  onClick={() => onSelect(issue.number)}
                  className={cn(
                    "flex w-full items-start gap-3 p-3 text-left hover:bg-accent/50",
                    active && "bg-accent",
                  )}
                >
                  {inner}
                </button>
              );
            }

            return (
              <Link
                key={issue.id}
                href={`/repositories/${repositoryId}/issues/${issue.number}`}
                className="flex items-start gap-3 p-3 hover:bg-accent/50"
              >
                {inner}
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea
              placeholder="Describe the issue…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-32"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!title.trim() || creating}>
              {creating && <Loader2 className="size-4 animate-spin" />}
              Create issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
