import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { closePullRequest } from "@/lib/github/pull-requests";
import { syncRepositoryPullRequests } from "@/lib/github/sync";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; number: string }> },
) {
  const { id, number } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  try {
    await closePullRequest(user.id, repository.owner, repository.name, Number(number));
    await syncRepositoryPullRequests(user.id, repository);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to close pull request." },
      { status: 502 },
    );
  }
}
