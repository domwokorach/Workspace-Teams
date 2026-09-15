"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/types/user";

export function useCurrentUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/users/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, isLoading };
}
