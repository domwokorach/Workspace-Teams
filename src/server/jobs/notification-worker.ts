import "server-only";
import { prisma } from "@/lib/db/client";
import type { NotificationType } from "@/generated/prisma/enums";

interface CreateNotificationInput {
  userId: string;
  workspaceId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/** Persists a notification. Called from feature services (e.g. issue assignment, PR review request). */
export async function enqueueNotification(input: CreateNotificationInput) {
  return prisma.notification.create({ data: input });
}

const RETENTION_DAYS = 90;

/** Deletes read notifications past the retention window. Intended for a scheduled trigger. */
export async function pruneReadNotifications() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.notification.deleteMany({
    where: { readAt: { not: null, lt: cutoff } },
  });
  return { deleted: count };
}
