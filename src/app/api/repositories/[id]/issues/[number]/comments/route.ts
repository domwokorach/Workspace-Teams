import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { addIssueComment } from "@/lib/github/issues";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; number: string }> },
) {
  const { id, number } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);
  const { body } = await request.json();

  if (!body?.trim()) return NextResponse.json({ error: "body is required" }, { status: 400 });

  try {
    const comment = await addIssueComment(user.id, repository.owner, repository.name, Number(number), body);
    return NextResponse.json({ comment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add comment." },
      { status: 502 },
    );
  }
}
