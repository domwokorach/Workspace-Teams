import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import {
  getPullRequest,
  listPullRequestFiles,
  listPullRequestCommits,
  listPullRequestReviews,
} from "@/lib/github/pull-requests";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; number: string }> },
) {
  const { id, number } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);
  const n = Number(number);

  try {
    const [pullRequest, files, commits, reviews] = await Promise.all([
      getPullRequest(user.id, repository.owner, repository.name, n),
      listPullRequestFiles(user.id, repository.owner, repository.name, n),
      listPullRequestCommits(user.id, repository.owner, repository.name, n),
      listPullRequestReviews(user.id, repository.owner, repository.name, n),
    ]);
    return NextResponse.json({ pullRequest, files, commits, reviews });
  } catch {
    return NextResponse.json({ error: "Failed to load pull request." }, { status: 502 });
  }
}
