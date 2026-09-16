"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationList() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    load();
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={markAllRead}>
            <CheckCheck className="size-3.5" /> Mark all as read
          </Button>
        </div>
      )}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Bell className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
          </CardContent>
        </Card>
      ) : (
        notifications.map((n) => {
          const content = (
            <div
              className={cn(
                "flex items-start gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-accent/50",
                !n.readAt && "bg-primary/5",
              )}
            >
              {!n.readAt && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
              <div className={cn("min-w-0 flex-1", n.readAt && "pl-3.5")}>
                <p className="font-medium">{n.title}</p>
                {n.body && <p className="text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
          return (
            <div key={n.id} onClick={() => !n.readAt && markRead(n.id)}>
              {n.link ? <Link href={n.link}>{content}</Link> : content}
            </div>
          );
        })
      )}
    </div>
  );
}
