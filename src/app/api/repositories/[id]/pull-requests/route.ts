import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { prisma } from "@/lib/db/client";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab");

  const where: Record<string, unknown> = { repositoryId: repository.id };
  if (tab === "open") where.state = "OPEN";
  if (tab === "draft") where.state = "DRAFT";
  if (tab === "merged") where.state = "MERGED";
  if (tab === "closed") where.state = "CLOSED";
  if (tab === "review-requested") where.reviewers = { some: { id: user.id } };

  const pullRequests = await prisma.pullRequest.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { author: true, reviews: true },
  });

  return NextResponse.json({ pullRequests });
}
