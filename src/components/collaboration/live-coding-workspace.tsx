"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Mic, MicOff, Video as VideoIcon, VideoOff, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomPanel } from "@/components/editor/bottom-panel";
import { ResizableSplit, type ResizablePaneSpec, type ResizableSplitHandle } from "@/components/layout/resizable-workspace";
import { ResetLayoutButton, ToggleContextPanelButton } from "@/components/layout/workspace-toolbar-controls";
import { useWorkspaceShortcuts } from "@/hooks/use-workspace-shortcuts";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getUserMedia } from "@/lib/video/media-devices";

const MonacoCodeEditor = dynamic(
  () => import("@/components/editor/monaco-code-editor").then((m) => m.MonacoCodeEditor),
  { ssr: false },
);

const SCRATCH_FILE = "session.ts";
const DEFAULT_SNIPPET = `// Shared scratchpad for this call.
// Real-time co-editing and peer video/audio aren't wired up yet —
// this is a local editor + camera self-preview + local chat.

function greet(name: string) {
  return \`Hello, \${name}!\`;
}
`;

function SelfVideoTile() {
  const { user } = useCurrentUser();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = React.useState(false);
  const [micOn, setMicOn] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  async function toggleCamera() {
    if (cameraOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraOn(false);
      return;
    }
    setError(null);
    try {
      const stream = await getUserMedia({});
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      setError("Couldn't access your camera/microphone. Check browser permissions.");
    }
  }

  React.useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}` : "?";

  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md bg-muted">
      {cameraOn ? (
        <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
      ) : (
        <Avatar className="size-12">
          <AvatarImage src={user?.avatarUrl ?? undefined} />
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
      )}
      <span className="absolute bottom-1.5 left-1.5 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium">
        You
      </span>
      <div className="absolute bottom-1.5 right-1.5 flex gap-1">
        <Button
          variant="secondary"
          size="icon-sm"
          className="size-6"
          onClick={() => setMicOn((v) => !v)}
          aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
        >
          {micOn ? <Mic className="size-3" /> : <MicOff className="size-3" />}
        </Button>
        <Button
          variant="secondary"
          size="icon-sm"
          className="size-6"
          onClick={toggleCamera}
          aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
        >
          {cameraOn ? <VideoIcon className="size-3" /> : <VideoOff className="size-3" />}
        </Button>
      </div>
      {error && (
        <p className="absolute inset-x-1 bottom-8 text-center text-[10px] text-destructive">{error}</p>
      )}
    </div>
  );
}

function ParticipantsPanel() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Users className="size-3.5" /> Participants (1)
      </p>
      <SelfVideoTile />
      <p className="mt-3 text-xs text-muted-foreground">
        Invite teammates to this session to see them here. Peer audio/video requires the signalling server, which
        isn&apos;t deployed yet — this preview only shows your own camera.
      </p>
    </div>
  );
}

interface ChatMessage {
  id: string;
  author: string;
  body: string;
  at: number;
}

function ChatPanel() {
  const { user } = useCurrentUser();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function send() {
    const body = draft.trim();
    if (!body) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), author: user ? `${user.firstName} ${user.lastName}` : "You", body, at: Date.now() },
    ]);
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col">
      <p className="shrink-0 border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Chat
      </p>
      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Messages here are local to your browser tab — chat sync isn&apos;t wired up yet.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="text-xs">
              <span className="font-medium">{m.author}</span>{" "}
              <span className="text-muted-foreground">{new Date(m.at).toLocaleTimeString()}</span>
              <p>{m.body}</p>
            </div>
          ))
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 border-t p-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message the call…"
          className="h-8 text-xs"
        />
        <Button size="icon-sm" onClick={send} aria-label="Send message">
          <Send className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function LiveCodingWorkspace() {
  const [code, setCode] = React.useState(DEFAULT_SNIPPET);
  const [sidePanelOpen, setSidePanelOpen] = React.useState(true);
  const [bottomOpen, setBottomOpen] = React.useState(true);
  const breakpoint = useBreakpoint();
  const outerRef = React.useRef<ResizableSplitHandle>(null);
  const leftRef = React.useRef<ResizableSplitHandle>(null);
  const rightRef = React.useRef<ResizableSplitHandle>(null);

  useWorkspaceShortcuts({
    onToggleSidebar: () => setSidePanelOpen((v) => !v),
    onToggleBottomPanel: () => setBottomOpen((v) => !v),
  });

  const leftPanes: ResizablePaneSpec[] = [
    {
      id: "editor",
      content: (
        <MonacoCodeEditor path={SCRATCH_FILE} value={code} language="typescript" onChange={setCode} />
      ),
      defaultSize: 70,
      minSize: 30,
    },
    { id: "terminal", content: <BottomPanel />, defaultSize: 30, minSize: 15, maxSize: 70, hidden: !bottomOpen },
  ];

  const rightPanes: ResizablePaneSpec[] = [
    { id: "participants", content: <ParticipantsPanel />, defaultSize: 55, minSize: 25 },
    { id: "chat", content: <ChatPanel />, defaultSize: 45, minSize: 25 },
  ];

  const left = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-end gap-1 border-b bg-muted/10 px-2 py-1">
        <ResetLayoutButton
          onReset={() => {
            outerRef.current?.reset();
            leftRef.current?.reset();
            rightRef.current?.reset();
          }}
        />
        <ToggleContextPanelButton open={sidePanelOpen} onToggle={() => setSidePanelOpen((v) => !v)} />
      </div>
      <div className="min-h-0 flex-1">
        <ResizableSplit ref={leftRef} storageId="workspace.calls.left" orientation="vertical" panes={leftPanes} />
      </div>
    </div>
  );

  const right = <ResizableSplit ref={rightRef} storageId="workspace.calls.right" orientation="vertical" panes={rightPanes} />;

  const outerPanes: ResizablePaneSpec[] = [
    { id: "left", content: left, defaultSize: 72, minSize: 40 },
    { id: "right", content: right, defaultSize: 28, minSize: 20, maxSize: 45, hidden: !sidePanelOpen },
  ];

  if (breakpoint !== "desktop") {
    return (
      <div className="flex h-[calc(100vh-10rem)] min-h-[480px] flex-col gap-3 overflow-y-auto">
        <div className="h-80 shrink-0 overflow-hidden rounded-md border">
          <MonacoCodeEditor path={SCRATCH_FILE} value={code} language="typescript" onChange={setCode} />
        </div>
        <div className="h-64 shrink-0 overflow-hidden rounded-md border">
          <ParticipantsPanel />
        </div>
        <div className="h-80 shrink-0 overflow-hidden rounded-md border">
          <ChatPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] min-h-[480px] overflow-hidden rounded-md border">
      <ResizableSplit ref={outerRef} storageId="workspace.calls" orientation="horizontal" panes={outerPanes} />
    </div>
  );
}
