"use client";

import * as React from "react";
import { Hash, Send, Loader2, Info, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessageContent } from "./message-content";
import { ResizableWorkspace } from "@/components/layout/resizable-workspace";
import { useBreakpoint } from "@/hooks/use-breakpoint";

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

function ChannelSidebar({
  channels,
  activeChannelId,
  onSelect,
}: {
  channels: ChannelLite[];
  activeChannelId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r">
      <div className="border-b p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channels</p>
      </div>
      <nav className="p-2">
        {channels.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
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
  );
}

function MessageThread({ message, onClose }: { message: MessageRow; onClose: () => void }) {
  const [reply, setReply] = React.useState("");

  return (
    <div className="flex h-full flex-col overflow-hidden border-l">
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <MessageSquare className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Thread</span>
        <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={onClose} aria-label="Close thread">
          <X className="size-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-start gap-3">
          <Avatar className="size-8">
            <AvatarImage src={message.author.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">
              {message.author.firstName[0]}
              {message.author.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium">
                {message.author.firstName} {message.author.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </span>
            </div>
            <MessageContent content={message.content} />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Threaded replies arrive with realtime messaging in a future update.
        </p>
      </div>
      <div className="border-t p-2.5">
        <Textarea
          placeholder="Reply in thread…"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="min-h-11 text-sm"
        />
      </div>
    </div>
  );
}

function MessagePane({
  activeChannel,
  messages,
  loading,
  draft,
  setDraft,
  sending,
  handleSend,
  onSelectThread,
  activeThreadId,
  bottomRef,
}: {
  activeChannel: ChannelLite | null;
  messages: MessageRow[];
  loading: boolean;
  draft: string;
  setDraft: (v: string) => void;
  sending: boolean;
  handleSend: () => void;
  onSelectThread: (m: MessageRow) => void;
  activeThreadId: string | null;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col">
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
              <div
                key={m.id}
                className={cn(
                  "group flex items-start gap-3 rounded-md px-1.5 py-1 -mx-1.5",
                  activeThreadId === m.id && "bg-accent/50",
                )}
              >
                <Avatar className="size-8">
                  <AvatarImage src={m.author.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {m.author.firstName[0]}
                    {m.author.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">
                      {m.author.firstName} {m.author.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <MessageContent content={m.content} />
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => onSelectThread(m)}
                  aria-label="Open thread"
                >
                  <MessageSquare className="size-3.5" />
                </Button>
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
  );
}

export function MessagesWorkspace({ channels }: { channels: ChannelLite[] }) {
  const [activeChannelId, setActiveChannelId] = React.useState(channels[0]?.id ?? null);
  const [messages, setMessages] = React.useState<MessageRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [threadMessage, setThreadMessage] = React.useState<MessageRow | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const breakpoint = useBreakpoint();

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

  function selectChannel(channelId: string) {
    setActiveChannelId(channelId);
    setThreadMessage(null);
  }

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

  const messagePane = (
    <MessagePane
      activeChannel={activeChannel}
      messages={messages}
      loading={loading}
      draft={draft}
      setDraft={setDraft}
      sending={sending}
      handleSend={handleSend}
      onSelectThread={setThreadMessage}
      activeThreadId={threadMessage?.id ?? null}
      bottomRef={bottomRef}
    />
  );

  if (breakpoint !== "desktop") {
    return (
      <div className="h-full">
        {messagePane}
        <Sheet open={!!threadMessage} onOpenChange={(open) => !open && setThreadMessage(null)}>
          <SheetContent side="right" className="w-80 p-0">
            <SheetTitle className="sr-only">Thread</SheetTitle>
            {threadMessage && <MessageThread message={threadMessage} onClose={() => setThreadMessage(null)} />}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <ResizableWorkspace
      storageId="workspace.messages"
      sidebar={<ChannelSidebar channels={channels} activeChannelId={activeChannelId} onSelect={selectChannel} />}
      sidebarDefaultSize={18}
      sidebarMinSize={12}
      sidebarMaxSize={28}
      main={messagePane}
      mainDefaultSize={57}
      mainMinSize={35}
      context={threadMessage ? <MessageThread message={threadMessage} onClose={() => setThreadMessage(null)} /> : undefined}
      contextOpen={!!threadMessage}
      contextDefaultSize={25}
      contextMinSize={15}
      contextMaxSize={40}
    />
  );
}
