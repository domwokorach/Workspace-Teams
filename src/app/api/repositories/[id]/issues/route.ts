import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { prisma } from "@/lib/db/client";
import { createIssue } from "@/lib/github/issues";
import { syncRepositoryIssues } from "@/lib/github/sync";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const assignedToMe = searchParams.get("assignedToMe") === "1";
  const createdByMe = searchParams.get("createdByMe") === "1";

  const issues = await prisma.issue.findMany({
    where: {
      repositoryId: repository.id,
      ...(state === "open" ? { state: "OPEN" } : state === "closed" ? { state: "CLOSED" } : {}),
      ...(assignedToMe ? { assignees: { some: { id: user.id } } } : {}),
      ...(createdByMe ? { authorId: user.id } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { author: true, assignees: true },
  });

  return NextResponse.json({ issues });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);
  const { title, body, labels } = await request.json();

  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  try {
    await createIssue(user.id, repository.owner, repository.name, { title, body, labels });
    await syncRepositoryIssues(user.id, repository);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create issue." },
      { status: 502 },
    );
  }
}
