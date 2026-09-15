import "server-only";
import { prisma } from "@/lib/db/client";
import { syncRepositoryIssues } from "@/lib/github/sync";

const STALE_AFTER_MINUTES = 15;

/** Re-syncs repositories that haven't been synced recently. Intended for a scheduled trigger (e.g. Vercel Cron). */
export async function runRepositorySync() {
  const staleBefore = new Date(Date.now() - STALE_AFTER_MINUTES * 60 * 1000);
  const repositories = await prisma.repository.findMany({
    where: { OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: staleBefore } }] },
    include: { members: { where: { role: "OWNER" }, take: 1 } },
  });

  const results = await Promise.allSettled(
    repositories.map(async (repository) => {
      const owner = repository.members[0];
      if (!owner) return;
      await syncRepositoryIssues(owner.userId, repository);
      await prisma.repository.update({
        where: { id: repository.id },
        data: { lastSyncedAt: new Date() },
      });
    }),
  );

  return { attempted: repositories.length, failed: results.filter((r) => r.status === "rejected").length };
}
