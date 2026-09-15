"use client";

import * as React from "react";
import { Hash, Send, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessageContent } from "./message-content";

interface ChannelLite {
  id: string;
  name: string;
  topic: string | null;
}

interface MessageRow {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export function MessagesWorkspace({ channels }: { channels: ChannelLite[] }) {
  const [activeChannelId, setActiveChannelId] = React.useState(channels[0]?.id ?? null);
  const [messages, setMessages] = React.useState<MessageRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;

  const load = React.useCallback(async () => {
    if (!activeChannelId) return;
    setLoading(true);
    const res = await fetch(`/api/channels/${activeChannelId}/messages`);
    const data = await res.json();
    setMessages(data.messages ?? []);
    setLoading(false);
  }, [activeChannelId]);

  React.useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!draft.trim() || !activeChannelId) return;
    setSending(true);
    try {
      await fetch(`/api/channels/${activeChannelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      setDraft("");
      load();
    } finally {
      setSending(false);
    }
  }

  if (channels.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        No channels yet.
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[220px_1fr]">
      <div className="hidden border-r md:block">
        <div className="border-b p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channels</p>
        </div>
        <nav className="p-2">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChannelId(c.id)}
              className={cn(
                "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm",
                activeChannelId === c.id ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/50",
              )}
            >
              <Hash className="size-3.5 shrink-0" />
              <span className="truncate">{c.name}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Hash className="size-4 text-muted-foreground" />
          <span className="font-medium">{activeChannel?.name}</span>
          {activeChannel?.topic && <span className="truncate text-xs text-muted-foreground">— {activeChannel.topic}</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <Alert className="mb-4">
            <Info className="size-4" />
            <AlertDescription>
              Messages send and persist, but live delivery and typing indicators arrive with realtime messaging in a
              future update — refresh to see new messages from teammates.
            </AlertDescription>
          </Alert>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet. Say hello to #{activeChannel?.name}.
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m.id} className="flex items-start gap-3">
                  <Avatar className="size-8">
                    <AvatarImage src={m.author.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs">{m.author.firstName[0]}{m.author.lastName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">{m.author.firstName} {m.author.lastName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <MessageContent content={m.content} />
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 border-t p-3">
          <Textarea
            placeholder={`Message #${activeChannel?.name ?? ""}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="min-h-11"
          />
          <Button size="icon" onClick={handleSend} disabled={!draft.trim() || sending} aria-label="Send message">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
