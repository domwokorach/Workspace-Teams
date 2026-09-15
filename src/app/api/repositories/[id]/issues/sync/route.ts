import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { syncRepositoryIssues } from "@/lib/github/sync";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  try {
    const count = await syncRepositoryIssues(user.id, repository);
    return NextResponse.json({ synced: count });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync issues." },
      { status: 502 },
    );
  }
}
