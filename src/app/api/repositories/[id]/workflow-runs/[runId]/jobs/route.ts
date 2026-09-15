import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { getWorkflowRunJobs } from "@/lib/github/actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  const { id, runId } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  try {
    const jobs = await getWorkflowRunJobs(user.id, repository.owner, repository.name, Number(runId));
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: "Failed to load workflow jobs." }, { status: 502 });
  }
}
