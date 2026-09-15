import "server-only";
import { prisma } from "@/lib/db/client";

export function createVideoRoom(workspaceId: string, name: string, hostUserId: string) {
  return prisma.videoRoom.create({
    data: {
      workspaceId,
      name,
      participants: { create: { userId: hostUserId } },
    },
  });
}

export async function joinVideoRoom(roomId: string, userId: string) {
  const existing = await prisma.videoParticipant.findFirst({ where: { roomId, userId } });
  if (existing) {
    return prisma.videoParticipant.update({ where: { id: existing.id }, data: { leftAt: null } });
  }
  return prisma.videoParticipant.create({ data: { roomId, userId } });
}

export function leaveVideoRoom(roomId: string, userId: string) {
  return prisma.videoParticipant.updateMany({
    where: { roomId, userId },
    data: { leftAt: new Date() },
  });
}

export function endVideoRoom(roomId: string) {
  return prisma.videoRoom.update({ where: { id: roomId }, data: { endedAt: new Date() } });
}
