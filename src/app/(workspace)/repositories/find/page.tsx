import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { RepositoryFinder } from "@/components/github/repository-finder";

export default async function FindRepositoryPage() {
  const user = await requireCurrentUser();
  const connection = await prisma.gitHubConnection.findUnique({ where: { userId: user.id } });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Find a repository</h1>
        <p className="text-sm text-muted-foreground">Search GitHub and import a repository into your workspace.</p>
      </div>
      <RepositoryFinder githubConnected={!!connection} githubUsername={connection?.githubUsername ?? null} />
    </div>
  );
}
