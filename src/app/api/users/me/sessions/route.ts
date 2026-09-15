import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const user = await requireCurrentUser();
  const tokens = await prisma.refreshToken.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    sessions: tokens.map((t) => ({ id: t.id, createdAt: t.createdAt, expiresAt: t.expiresAt })),
  });
}

export async function DELETE(request: Request) {
  const user = await requireCurrentUser();
  const { id } = await request.json();
  await prisma.refreshToken.updateMany({
    where: { id, userId: user.id },
    data: { revokedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
