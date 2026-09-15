import { Suspense } from "react";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const connection = await prisma.gitHubConnection.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, account, and workspace preferences.</p>
      </div>
      <Suspense>
        <SettingsTabs
          user={user}
          github={connection ? { username: connection.githubUsername, connectedAt: connection.connectedAt.toISOString() } : null}
        />
      </Suspense>
    </div>
  );
}
