import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { listContributors, getCommitActivity } from "@/lib/github/contributors";
import { prisma } from "@/lib/db/client";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  try {
    const [contributors, activity] = await Promise.all([
      listContributors(user.id, repository.owner, repository.name),
      getCommitActivity(user.id, repository.owner, repository.name),
    ]);

    // Best-effort local activity counts for contributors who are also workspace members.
    const logins = contributors.map((c) => c.login);
    const members = await prisma.user.findMany({
      where: { githubUsername: { in: logins } },
      select: { id: true, githubUsername: true },
    });
    const memberByLogin = new Map(members.map((m) => [m.githubUsername, m.id]));

    const enriched = await Promise.all(
      contributors.map(async (c) => {
        const userId = memberByLogin.get(c.login);
        if (!userId) return { ...c, pullRequests: 0, issues: 0, lastActiveAt: null };
        const [pullRequests, issues] = await Promise.all([
          prisma.pullRequest.count({ where: { repositoryId: repository.id, authorId: userId } }),
          prisma.issue.count({ where: { repositoryId: repository.id, authorId: userId } }),
        ]);
        return { ...c, pullRequests, issues, lastActiveAt: null };
      }),
    );

    return NextResponse.json({ contributors: enriched, activity });
  } catch {
    return NextResponse.json({ error: "Failed to load contributors." }, { status: 502 });
  }
}
