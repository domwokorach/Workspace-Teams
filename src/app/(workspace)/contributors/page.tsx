import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getDefaultWorkspace } from "@/lib/workspace";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function ContributorsPage() {
  const user = await requireCurrentUser();
  const workspace = await getDefaultWorkspace(user.id).catch(() => null);

  const members = workspace
    ? await prisma.workspaceMember.findMany({
        where: { workspaceId: workspace.id },
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      })
    : [];

  const repos = workspace
    ? await prisma.repository.findMany({ where: { workspaceId: workspace.id }, select: { id: true, name: true } })
    : [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Contributors</h1>
        <p className="text-sm text-muted-foreground">
          Team members in your workspace. For per-repository GitHub contributor stats, open a repository&apos;s
          Contributors tab.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="size-10">
                <AvatarImage src={m.user.avatarUrl ?? undefined} />
                <AvatarFallback>{m.user.firstName[0]}{m.user.lastName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.user.firstName} {m.user.lastName}</p>
                <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">{m.role}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {repos.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Per-repository stats</p>
          <div className="flex flex-wrap gap-2">
            {repos.map((r) => (
              <Link key={r.id} href={`/repositories/${r.id}/contributors`}>
                <Badge variant="outline" className="font-mono">{r.name}</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
