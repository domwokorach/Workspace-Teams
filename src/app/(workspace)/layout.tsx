import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getDefaultWorkspace } from "@/lib/workspace";
import { AppShell } from "@/components/layout/app-shell";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspace = await getDefaultWorkspace(user.id).catch(() => null);

  const recentRepositories = workspace
    ? await prisma.repository.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { id: true, name: true, owner: true, isPrivate: true },
      })
    : [];

  const [unreadNotifications, githubConnection] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.gitHubConnection.findUnique({ where: { userId: user.id }, select: { githubUsername: true } }),
  ]);

  return (
    <AppShell
      user={user}
      workspace={workspace ? { id: workspace.id, name: workspace.name } : null}
      recentRepositories={recentRepositories}
      unreadNotifications={unreadNotifications}
      githubUsername={githubConnection?.githubUsername ?? null}
    >
      {children}
    </AppShell>
  );
}
