import "server-only";
import { prisma } from "@/lib/db/client";

export function startCodingSession(repositoryId: string, filePath: string, userId: string) {
  return prisma.codingSession.create({
    data: {
      repositoryId,
      filePath,
      participants: { create: { userId } },
    },
  });
}

export async function joinCodingSession(sessionId: string, userId: string) {
  const existing = await prisma.codingSessionParticipant.findFirst({ where: { sessionId, userId } });
  if (existing) {
    return prisma.codingSessionParticipant.update({ where: { id: existing.id }, data: { leftAt: null } });
  }
  return prisma.codingSessionParticipant.create({ data: { sessionId, userId } });
}

export function leaveCodingSession(sessionId: string, userId: string) {
  return prisma.codingSessionParticipant.updateMany({
    where: { sessionId, userId },
    data: { leftAt: new Date() },
  });
}

export function endCodingSession(sessionId: string) {
  return prisma.codingSession.update({ where: { id: sessionId }, data: { endedAt: new Date() } });
}
