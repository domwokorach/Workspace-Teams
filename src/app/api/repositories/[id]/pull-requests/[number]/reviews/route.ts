import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { createReview } from "@/lib/github/pull-requests";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; number: string }> },
) {
  const { id, number } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);
  const { event, body } = await request.json();

  if (!["APPROVE", "REQUEST_CHANGES", "COMMENT"].includes(event)) {
    return NextResponse.json({ error: "Invalid review event." }, { status: 400 });
  }

  try {
    const review = await createReview(user.id, repository.owner, repository.name, Number(number), { event, body });
    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit review." },
      { status: 502 },
    );
  }
}
