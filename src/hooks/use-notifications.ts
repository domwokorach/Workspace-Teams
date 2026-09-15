"use client";

import { useEffect, useState } from "react";
import type { NotificationSummary } from "@/types/notification";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : { notifications: [] }))
      .then((data) => {
        if (!cancelled) setNotifications(data.notifications ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return { notifications, markRead };
}
