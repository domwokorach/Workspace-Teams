import Link from "next/link";
import { FolderGit2, Lock, Globe, Plus, Star, GitFork, CircleDot } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getDefaultWorkspace } from "@/lib/workspace";

export default async function RepositoriesPage() {
  const user = await requireCurrentUser();
  const workspace = await getDefaultWorkspace(user.id).catch(() => null);

  const repos = workspace
    ? await prisma.repository.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Repositories</h1>
          <p className="text-sm text-muted-foreground">Repositories imported into your workspace.</p>
        </div>
        <Link href="/repositories/find" className={cn(buttonVariants())}>
          <Plus /> Find a repository
        </Link>
      </div>

      {repos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FolderGit2 className="size-10 text-muted-foreground" />
            <p className="font-medium">No repositories connected yet.</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Connect GitHub to import your first repository and start browsing code, issues, and pull requests.
            </p>
            <Link href="/repositories/find" className={cn(buttonVariants())}>
              Find a repository
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <Link key={repo.id} href={`/repositories/${repo.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    {repo.isPrivate ? (
                      <Lock className="size-3.5 text-muted-foreground" />
                    ) : (
                      <Globe className="size-3.5 text-muted-foreground" />
                    )}
                    <span className="truncate font-mono text-sm font-medium">{repo.fullName}</span>
                  </div>
                  {repo.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{repo.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-primary" />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="size-3" />
                      {repo.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="size-3" />
                      {repo.forks}
                    </span>
                    <span className="flex items-center gap-1">
                      <CircleDot className="size-3" />
                      {repo.openIssuesCount}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
