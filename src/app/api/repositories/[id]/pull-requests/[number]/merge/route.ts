import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { mergePullRequest } from "@/lib/github/pull-requests";
import { syncRepositoryPullRequests } from "@/lib/github/sync";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; number: string }> },
) {
  const { id, number } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  const membership = await prisma.repositoryMember.findUnique({
    where: { repositoryId_userId: { repositoryId: repository.id, userId: user.id } },
  });
  if (!membership || !can.mergePullRequest(membership.role)) {
    return NextResponse.json({ error: "You do not have permission to merge pull requests." }, { status: 403 });
  }

  const { method } = await request.json().catch(() => ({ method: "merge" }));

  try {
    await mergePullRequest(user.id, repository.owner, repository.name, Number(number), method);
    await syncRepositoryPullRequests(user.id, repository);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to merge pull request." },
      { status: 502 },
    );
  }
}
