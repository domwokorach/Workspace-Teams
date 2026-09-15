"use client";

import * as React from "react";
import { GitBranch, GitCommit, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import type { GitHubBranchSummary, GitHubCommitSummary } from "@/types/github";

export interface DirtyFile {
  path: string;
  content: string;
  sha?: string;
  staged: boolean;
}

export function GitPanel({
  repositoryId,
  branch,
  onBranchChange,
  dirtyFiles,
  onToggleStaged,
  onCommitted,
}: {
  repositoryId: string;
  branch: string;
  onBranchChange: (branch: string) => void;
  dirtyFiles: DirtyFile[];
  onToggleStaged: (path: string) => void;
  onCommitted: (paths: string[]) => void;
}) {
  const [branches, setBranches] = React.useState<GitHubBranchSummary[]>([]);
  const [commits, setCommits] = React.useState<GitHubCommitSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [committing, setCommitting] = React.useState(false);
  const [newBranchOpen, setNewBranchOpen] = React.useState(false);
  const [newBranchName, setNewBranchName] = React.useState("");

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const [branchesRes, commitsRes] = await Promise.all([
      fetch(`/api/repositories/${repositoryId}/branches`),
      fetch(`/api/repositories/${repositoryId}/commits?branch=${encodeURIComponent(branch)}`),
    ]);
    const branchesData = await branchesRes.json();
    const commitsData = await commitsRes.json();
    setBranches(branchesData.branches ?? []);
    setCommits(commitsData.commits ?? []);
    setLoading(false);
  }, [repositoryId, branch]);

  React.useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);

  const staged = dirtyFiles.filter((f) => f.staged);

  async function handleCommit() {
    if (!message.trim() || staged.length === 0) return;
    setCommitting(true);
    try {
      for (const file of staged) {
        await fetch(`/api/repositories/${repositoryId}/file-content`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: file.path, content: file.content, message, branch, sha: file.sha }),
        });
      }
      onCommitted(staged.map((f) => f.path));
      setMessage("");
      refresh();
    } finally {
      setCommitting(false);
    }
  }

  async function handleCreateBranch() {
    if (!newBranchName.trim()) return;
    await fetch(`/api/repositories/${repositoryId}/branches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newBranchName, fromBranch: branch }),
    });
    setNewBranchOpen(false);
    setNewBranchName("");
    onBranchChange(newBranchName);
    refresh();
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3 text-sm">
      <div className="flex items-center gap-2">
        <GitBranch className="size-4 shrink-0 text-muted-foreground" />
        <Select value={branch} onValueChange={(v) => v && onBranchChange(v)}>
          <SelectTrigger className="h-7 flex-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.name} value={b.name}>
                {b.name}
                {b.isDefault ? " (default)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon-sm" onClick={() => setNewBranchOpen(true)} aria-label="Create branch">
          <Plus className="size-3.5" />
        </Button>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Changes {dirtyFiles.length > 0 && `(${dirtyFiles.length})`}
        </p>
        {dirtyFiles.length === 0 ? (
          <p className="text-xs text-muted-foreground">No local changes. Edit a file to see it here.</p>
        ) : (
          <ul className="space-y-1">
            {dirtyFiles.map((f) => (
              <li key={f.path} className="flex items-center gap-2">
                <Checkbox checked={f.staged} onCheckedChange={() => onToggleStaged(f.path)} />
                <span className="truncate font-mono text-xs">{f.path}</span>
              </li>
            ))}
          </ul>
        )}
        {dirtyFiles.length > 0 && (
          <div className="mt-2 space-y-2">
            <Textarea
              placeholder="Commit message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-16 text-xs"
            />
            <Button
              size="sm"
              className="w-full"
              disabled={staged.length === 0 || !message.trim() || committing}
              onClick={handleCommit}
            >
              {committing ? <Loader2 className="size-3.5 animate-spin" /> : <GitCommit className="size-3.5" />}
              Commit {staged.length > 0 && `${staged.length} file${staged.length > 1 ? "s" : ""}`}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Commits are written straight to GitHub on <span className="font-mono">{branch}</span> — no local
              clone required.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent commits</p>
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <ul className="space-y-2.5">
            {commits.slice(0, 15).map((c) => (
              <li key={c.sha} className="text-xs">
                <p className="line-clamp-2">{c.message.split("\n")[0]}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="size-3" />
                  {c.authorName} · {formatDistanceToNow(new Date(c.committedAt), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={newBranchOpen} onOpenChange={setNewBranchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create branch</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="feature/my-branch"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Branched from <span className="font-mono">{branch}</span></p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewBranchOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBranch} disabled={!newBranchName.trim()}>Create branch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
