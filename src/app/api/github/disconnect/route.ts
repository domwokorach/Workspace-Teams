import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getGitHubToken } from "@/lib/github/client";
import { revokeGitHubToken } from "@/lib/github/oauth";
import { prisma } from "@/lib/db/client";

export async function POST() {
  const user = await requireCurrentUser();
  const token = await getGitHubToken(user.id);
  if (token) await revokeGitHubToken(token);

  await prisma.gitHubConnection.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
