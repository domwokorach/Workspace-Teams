import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { listWorkflowRuns } from "@/lib/github/actions";
import { GitHubNotConnectedError } from "@/lib/github/client";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  try {
    const runs = await listWorkflowRuns(user.id, repository.owner, repository.name);
    return NextResponse.json({ runs });
  } catch (error) {
    if (error instanceof GitHubNotConnectedError) {
      return NextResponse.json({ error: error.message, code: "not_connected" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to load workflow runs." }, { status: 502 });
  }
}
