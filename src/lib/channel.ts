import "server-only";
import { prisma } from "@/lib/db/client";
import { AuthError } from "@/lib/auth/session";

export async function getAccessibleChannel(userId: string, channelId: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { workspace: { include: { members: { where: { userId } } } } },
  });
  if (!channel || channel.workspace.members.length === 0) {
    throw new AuthError("FORBIDDEN", "You do not have access to this channel.");
  }
  return channel;
}
