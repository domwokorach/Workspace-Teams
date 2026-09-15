import "server-only";
import { prisma } from "@/lib/db/client";

export function listTestRuns(repositoryId: string, take = 25) {
  return prisma.testRun.findMany({
    where: { repositoryId },
    orderBy: { startedAt: "desc" },
    take,
    include: { results: true },
  });
}

export function getTestRun(testRunId: string) {
  return prisma.testRun.findUnique({
    where: { id: testRunId },
    include: { results: true },
  });
}
