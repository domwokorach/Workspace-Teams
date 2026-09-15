import type { NotificationType } from "@/generated/prisma/enums";

export interface NotificationSummary {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}
