"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { MobileNav } from "./mobile-nav";
import { CommandPalette } from "./command-palette";
import { ResizableSplit, type ResizablePaneSpec } from "./resizable-workspace";
import { useWorkspaceShortcuts } from "@/hooks/use-workspace-shortcuts";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CurrentUser } from "@/lib/auth/session";

interface RepoLite {
  id: string;
  name: string;
  owner: string;
  isPrivate: boolean;
}

interface AppShellProps {
  user: CurrentUser;
  workspace: { id: string; name: string } | null;
  recentRepositories: RepoLite[];
  unreadNotifications: number;
  githubUsername: string | null;
  children: React.ReactNode;
}

export function AppShell({
  user,
  workspace,
  recentRepositories,
  unreadNotifications,
  githubUsername,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useWorkspaceShortcuts({ onToggleSidebar: () => setCollapsed((v) => !v) });

  const sidebar = (
    <Sidebar
      user={user}
      workspaceName={workspace?.name ?? null}
      recentRepositories={recentRepositories}
      collapsed={collapsed}
      onToggle={() => setCollapsed((v) => !v)}
    />
  );

  const main = (
    <div className="flex min-w-0 flex-1 flex-col h-full">
      <TopNav
        unreadNotifications={unreadNotifications}
        githubConnected={!!githubUsername}
        onOpenCommandPalette={() => setPaletteOpen(true)}
      />
      <main className="flex-1 overflow-y-auto pb-14 md:pb-0">{children}</main>
    </div>
  );

  const panes: ResizablePaneSpec[] = [
    {
      id: "app-sidebar",
      content: sidebar,
      defaultSize: collapsed ? "64px" : "18%",
      minSize: collapsed ? "64px" : "12%",
      maxSize: collapsed ? "64px" : "28%",
      hidden: isMobile,
      className: "hidden md:block",
    },
    { id: "app-main", content: main, defaultSize: "82%", minSize: "35%" },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {isMobile ? (
        main
      ) : (
        <ResizableSplit storageId="workspace.shell" orientation="horizontal" panes={panes} withHandle />
      )}
      <MobileNav />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
