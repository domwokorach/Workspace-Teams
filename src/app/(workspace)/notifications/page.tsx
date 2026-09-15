import { requireCurrentUser } from "@/lib/auth/session";
import { NotificationList } from "@/components/shared/notification-list";

export default async function NotificationsPage() {
  await requireCurrentUser();
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">Mentions, review requests, build status, and more.</p>
      </div>
      <NotificationList />
    </div>
  );
}
