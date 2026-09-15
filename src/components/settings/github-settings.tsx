"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GitBranch, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your environment.",
  denied: "GitHub authorization was denied.",
  invalid_state: "GitHub authorization state was invalid. Please try again.",
  exchange_failed: "Failed to complete GitHub authorization. Please try again.",
};

export function GitHubSettings({ github }: { github: { username: string; connectedAt: string } | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [disconnecting, setDisconnecting] = React.useState(false);

  const error = searchParams.get("github_error");
  const connected = searchParams.get("github_connected");

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/github/disconnect", { method: "POST" });
      router.refresh();
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">GitHub</CardTitle>
        <CardDescription>Connect GitHub to import repositories and sync issues, pull requests, and CI status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <XCircle className="size-4" />
            <AlertDescription>{ERROR_MESSAGES[error] ?? "Something went wrong connecting GitHub."}</AlertDescription>
          </Alert>
        )}
        {connected && (
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertDescription>GitHub account connected.</AlertDescription>
          </Alert>
        )}

        {github ? (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <GitBranch className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">@{github.username}</p>
                <p className="text-xs text-muted-foreground">
                  Connected {new Date(github.connectedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleDisconnect} disabled={disconnecting}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button render={<a href="/api/github/connect" />}>
            <GitBranch /> Connect GitHub
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
