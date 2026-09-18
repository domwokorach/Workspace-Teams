import { WorkspaceTerminal } from "@/components/terminal/workspace-terminal";

export default function TerminalPreviewPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <WorkspaceTerminal />
      </div>
    </main>
  );
}
