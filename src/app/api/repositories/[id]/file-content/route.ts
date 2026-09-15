import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { getFileContent, commitFile } from "@/lib/github/repositories";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db/client";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const ref = searchParams.get("ref") ?? repository.defaultBranch;
  if (!path) return NextResponse.json({ error: "path is required" }, { status: 400 });

  try {
    const file = await getFileContent(user.id, repository.owner, repository.name, path, ref);
    return NextResponse.json(file);
  } catch {
    return NextResponse.json({ error: "Failed to load file content." }, { status: 502 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  const membership = await prisma.repositoryMember.findUnique({
    where: { repositoryId_userId: { repositoryId: repository.id, userId: user.id } },
  });
  if (!membership || !can.editCode(membership.role)) {
    return NextResponse.json({ error: "You do not have permission to commit to this repository." }, { status: 403 });
  }

  const { path, content, message, branch, sha } = await request.json();
  if (!path || content === undefined || !message || !branch) {
    return NextResponse.json({ error: "path, content, message, and branch are required" }, { status: 400 });
  }

  try {
    const result = await commitFile(user.id, repository.owner, repository.name, {
      path,
      content,
      message,
      branch,
      sha,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to commit file." },
      { status: 502 },
    );
  }
}
