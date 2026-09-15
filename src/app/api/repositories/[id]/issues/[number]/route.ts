import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { getIssue, updateIssue, listIssueComments } from "@/lib/github/issues";
import { prisma } from "@/lib/db/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; number: string }> },
) {
  const { id, number } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  try {
    const [issue, comments] = await Promise.all([
      getIssue(user.id, repository.owner, repository.name, Number(number)),
      listIssueComments(user.id, repository.owner, repository.name, Number(number)),
    ]);
    return NextResponse.json({ issue, comments });
  } catch {
    return NextResponse.json({ error: "Failed to load issue." }, { status: 502 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; number: string }> },
) {
  const { id, number } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);
  const body = await request.json();

  try {
    const issue = await updateIssue(user.id, repository.owner, repository.name, Number(number), body);
    await prisma.issue.updateMany({
      where: { repositoryId: repository.id, number: Number(number) },
      data: {
        title: issue.title,
        description: issue.body,
        state: issue.state === "open" ? "OPEN" : "CLOSED",
        labels: issue.labels.map((l) => l.name),
        closedAt: issue.closedAt ? new Date(issue.closedAt) : null,
      },
    });
    return NextResponse.json({ issue });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update issue." },
      { status: 502 },
    );
  }
}
