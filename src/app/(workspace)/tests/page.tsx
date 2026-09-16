import Link from "next/link";
import { FlaskConical, ArrowUpRight } from "lucide-react";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getDefaultWorkspace } from "@/lib/workspace";
import { Card, CardContent } from "@/components/ui/card";

export default async function TestsOverviewPage() {
  const user = await requireCurrentUser();
  const workspace = await getDefaultWorkspace(user.id).catch(() => null);

  const repos = workspace
    ? await prisma.repository.findMany({ where: { workspaceId: workspace.id }, orderBy: { updatedAt: "desc" } })
    : [];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tests / CI</h1>
        <p className="text-sm text-muted-foreground">Select a repository to inspect its workflow runs and test status.</p>
      </div>

      {repos.length === 0 ? (
        <div className="rounded-md border py-16 text-center text-sm text-muted-foreground">
          No repositories connected yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <Link key={repo.id} href={`/repositories/${repo.id}/tests`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <FlaskConical className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate font-mono text-sm">{repo.fullName}</span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
