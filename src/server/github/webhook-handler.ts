import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/client";

export function verifyGithubWebhookSignature(payload: string, signatureHeader: string | null) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface GithubWebhookEvent {
  action?: string;
  repository?: { full_name: string };
}

/** Dispatches a verified GitHub webhook payload by event name. Call from the `/api/github/webhooks` route once configured. */
export async function handleGithubWebhookEvent(eventName: string, payload: GithubWebhookEvent) {
  const repository = payload.repository
    ? await prisma.repository.findUnique({ where: { fullName: payload.repository.full_name } })
    : null;

  if (!repository) return { handled: false };

  switch (eventName) {
    case "issues":
    case "pull_request":
    case "push":
      await prisma.repository.update({ where: { id: repository.id }, data: { lastSyncedAt: null } });
      return { handled: true };
    default:
      return { handled: false };
  }
}
