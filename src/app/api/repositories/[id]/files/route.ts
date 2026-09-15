import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { listFiles } from "@/lib/github/repositories";
import { GitHubNotConnectedError } from "@/lib/github/client";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") ?? "";
  const ref = searchParams.get("ref") ?? repository.defaultBranch;

  try {
    const files = await listFiles(user.id, repository.owner, repository.name, path, ref);
    return NextResponse.json({ files });
  } catch (error) {
    if (error instanceof GitHubNotConnectedError) {
      return NextResponse.json({ error: error.message, code: "not_connected" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to load files." }, { status: 502 });
  }
}
