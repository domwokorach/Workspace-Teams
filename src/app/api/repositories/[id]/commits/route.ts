import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { listCommits } from "@/lib/github/repositories";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);
  const { searchParams } = new URL(request.url);

  try {
    const commits = await listCommits(user.id, repository.owner, repository.name, {
      branch: searchParams.get("branch") ?? repository.defaultBranch,
      page: Number(searchParams.get("page") ?? "1"),
    });
    return NextResponse.json({ commits });
  } catch {
    return NextResponse.json({ error: "Failed to load commits." }, { status: 502 });
  }
}
