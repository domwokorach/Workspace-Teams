import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { listBranches, createBranch } from "@/lib/github/repositories";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  try {
    const branches = await listBranches(user.id, repository.owner, repository.name);
    return NextResponse.json({ branches });
  } catch {
    return NextResponse.json({ error: "Failed to load branches." }, { status: 502 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);
  const { name, fromBranch } = await request.json();

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  try {
    await createBranch(user.id, repository.owner, repository.name, {
      name,
      fromBranch: fromBranch ?? repository.defaultBranch,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create branch." },
      { status: 502 },
    );
  }
}
