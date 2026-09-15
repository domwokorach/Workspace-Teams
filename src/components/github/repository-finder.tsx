"use client";

import * as React from "react";
import Link from "next/link";
import { GitBranch, Search, Lock, Globe, Star, GitFork, CircleDot, ExternalLink, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ImportRepositoryDialog } from "./import-repository-dialog";
import type { GitHubRepoSummary } from "@/types/github";

export function RepositoryFinder({
  githubConnected,
  githubUsername,
}: {
  githubConnected: boolean;
  githubUsername: string | null;
}) {
  const [query, setQuery] = React.useState("");
  const [owner, setOwner] = React.useState("");
  const [language, setLanguage] = React.useState("");
  const [visibility, setVisibility] = React.useState<"all" | "public" | "private">("all");
  const [sort, setSort] = React.useState<"updated" | "stars" | "forks">("updated");
  const [results, setResults] = React.useState<GitHubRepoSummary[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [importTarget, setImportTarget] = React.useState<GitHubRepoSummary | null>(null);

  const search = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (owner) params.set("owner", owner);
      if (language) params.set("language", language);
      params.set("visibility", visibility);
      params.set("sort", sort);

      const res = await fetch(`/api/github/repositories?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to search repositories.");
        setResults([]);
        return;
      }
      setResults(data.repos ?? []);
    } catch {
      setError("Network error while searching repositories.");
    } finally {
      setLoading(false);
    }
  }, [query, owner, language, visibility, sort]);

  React.useEffect(() => {
    if (githubConnected) queueMicrotask(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubConnected]);

  if (!githubConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <GitBranch className="size-10 text-muted-foreground" />
          <p className="font-medium">Connect your GitHub account</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Connect GitHub to search your repositories, import one into this workspace, and sync issues, pull
            requests, and CI status.
          </p>
          <Button render={<Link href="/api/github/connect" />}>Connect GitHub</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search repositories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="pl-8"
          />
        </div>
        <Input
          placeholder={`Owner (default: ${githubUsername ?? "you"})`}
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="sm:w-48"
        />
        <Input
          placeholder="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="sm:w-36"
        />
        <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
          <SelectTrigger className="sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Recently updated</SelectItem>
            <SelectItem value="stars">Most stars</SelectItem>
            <SelectItem value="forks">Most forks</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={search} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Search
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Search failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No repositories found. Try a different search.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map((repo) => (
            <Card key={repo.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {repo.isPrivate ? (
                      <Lock className="size-3.5 text-muted-foreground" />
                    ) : (
                      <Globe className="size-3.5 text-muted-foreground" />
                    )}
                    <span className="truncate font-mono text-sm font-medium">{repo.fullName}</span>
                  </div>
                  {repo.description && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{repo.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-primary" /> {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1"><Star className="size-3" /> {repo.stars}</span>
                    <span className="flex items-center gap-1"><GitFork className="size-3" /> {repo.forks}</span>
                    <span className="flex items-center gap-1"><CircleDot className="size-3" /> {repo.openIssues}</span>
                    <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                    <span className="font-mono">{repo.defaultBranch}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button size="sm" onClick={() => setImportTarget(repo)}>
                    <Download /> Import
                  </Button>
                  <Button size="sm" variant="outline" render={<a href={repo.htmlUrl} target="_blank" rel="noreferrer" />}>
                    <ExternalLink /> View on GitHub
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ImportRepositoryDialog repo={importTarget} onClose={() => setImportTarget(null)} />
    </div>
  );
}
