import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getDefaultWorkspace } from "@/lib/workspace";
import { MessagesWorkspace } from "@/components/messaging/messages-workspace";

export default async function MessagesPage() {
  const user = await requireCurrentUser();
  const workspace = await getDefaultWorkspace(user.id).catch(() => null);

  const channels = workspace
    ? await prisma.channel.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, topic: true },
      })
    : [];

  return (
    <div className="h-full">
      <MessagesWorkspace channels={channels} />
    </div>
  );
}
