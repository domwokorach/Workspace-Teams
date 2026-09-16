import { LiveCodingWorkspace } from "@/components/collaboration/live-coding-workspace";

export default function CallsPage() {
  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Live Coding</h1>
        <p className="text-sm text-muted-foreground">
          A shared scratchpad, terminal, camera preview, and chat for pairing with your team.
        </p>
      </div>
      <LiveCodingWorkspace />
    </div>
  );
}
