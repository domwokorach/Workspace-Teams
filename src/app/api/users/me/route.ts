import { NextResponse } from "next/server";
import { getCurrentUser, requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  return NextResponse.json({ user });
}

const updateSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  timezone: z.string().max(64).optional(),
  status: z.enum(["ONLINE", "AWAY", "BUSY", "OFFLINE"]).optional(),
});

export async function PATCH(request: Request) {
  const user = await requireCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      avatarUrl: true,
      githubUsername: true,
      status: true,
      timezone: true,
    },
  });

  return NextResponse.json({ user: updated });
}
