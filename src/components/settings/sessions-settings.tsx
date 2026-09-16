"use client";

import * as React from "react";
import { Loader2, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface SessionRow {
  id: string;
  createdAt: string;
  expiresAt: string;
}

export function SessionsSettings() {
  const [sessions, setSessions] = React.useState<SessionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [revoking, setRevoking] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/users/me/sessions");
    const data = await res.json();
    setSessions(data.sessions ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function handleRevoke(id: string) {
    setRevoking(id);
    try {
      await fetch("/api/users/me/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      load();
    } finally {
      setRevoking(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Active sessions</CardTitle>
        <CardDescription>Devices currently signed in to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions.</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Monitor className="size-4 text-muted-foreground" />
                  <span>Signed in {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleRevoke(s.id)} disabled={revoking === s.id}>
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
