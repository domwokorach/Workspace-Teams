"use client";

import * as React from "react";
import { Loader2, GitCommit, GitPullRequest, CircleDot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Contributor {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  commits: number;
  additions: number;
  deletions: number;
  pullRequests: number;
  issues: number;
}

interface ActivityWeek {
  weekStart: string;
  total: number;
}

export function RepositoryContributors({ repositoryId }: { repositoryId: string }) {
  const [contributors, setContributors] = React.useState<Contributor[]>([]);
  const [activity, setActivity] = React.useState<ActivityWeek[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/repositories/${repositoryId}/contributors`)
      .then((r) => r.json())
      .then((data) => {
        setContributors(data.contributors ?? []);
        setActivity(data.activity ?? []);
      })
      .finally(() => setLoading(false));
  }, [repositoryId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const recentWeeks = activity.slice(-26);
  const maxCommits = Math.max(1, ...recentWeeks.map((w) => w.total));
  const totalCommits = contributors.reduce((s, c) => s + c.commits, 0) || 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Commits over time</CardTitle>
        </CardHeader>
        <CardContent>
          {recentWeeks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No commit activity data available.</p>
          ) : (
            <div className="flex h-24 items-end gap-0.5">
              {recentWeeks.map((w) => (
                <div
                  key={w.weekStart}
                  className="flex-1 rounded-sm bg-primary/70 transition-colors hover:bg-primary"
                  style={{ height: `${Math.max(4, (w.total / maxCommits) * 100)}%` }}
                  title={`${w.total} commits · week of ${new Date(w.weekStart).toLocaleDateString()}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Contribution distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {contributors.slice(0, 8).map((c) => (
            <div key={c.login} className="flex items-center gap-2">
              <span className="w-28 shrink-0 truncate text-xs">{c.login}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(c.commits / totalCommits) * 100}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">{c.commits}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {contributors.map((c) => (
          <a key={c.login} href={c.htmlUrl} target="_blank" rel="noreferrer">
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <Avatar className="size-9">
                    <AvatarImage src={c.avatarUrl} />
                    <AvatarFallback>{c.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.login}</p>
                    <p className="truncate text-xs text-muted-foreground">@{c.login}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><GitCommit className="size-3.5" /> {c.commits}</span>
                  <span className="flex items-center gap-1"><GitPullRequest className="size-3.5" /> {c.pullRequests}</span>
                  <span className="flex items-center gap-1"><CircleDot className="size-3.5" /> {c.issues}</span>
                </div>
                <p className="text-xs">
                  <span className="text-emerald-500">+{c.additions}</span>{" "}
                  <span className="text-red-500">-{c.deletions}</span>
                </p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
