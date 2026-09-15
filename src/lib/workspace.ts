import "server-only";
import { prisma } from "@/lib/db/client";

/** Returns the first workspace the user belongs to (Phase 1: one workspace per user). */
export async function getDefaultWorkspace(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) {
    throw new Error("User has no workspace membership.");
  }
  return membership.workspace;
}
