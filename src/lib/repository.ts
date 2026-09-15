import "server-only";
import { prisma } from "@/lib/db/client";
import { AuthError } from "@/lib/auth/session";

/** Loads a repository the user has access to, or throws a FORBIDDEN AuthError. */
export async function getAccessibleRepository(userId: string, repositoryId: string) {
  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
    include: { workspace: { include: { members: { where: { userId } } } } },
  });

  if (!repository || repository.workspace.members.length === 0) {
    throw new AuthError("FORBIDDEN", "You do not have access to this repository.");
  }

  return repository;
}
