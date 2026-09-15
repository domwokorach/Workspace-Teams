"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { MobileNav } from "./mobile-nav";
import { CommandPalette } from "./command-palette";
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

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        user={user}
        workspaceName={workspace?.name ?? null}
        recentRepositories={recentRepositories}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          unreadNotifications={unreadNotifications}
          githubConnected={!!githubUsername}
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />
        <main className="flex-1 overflow-y-auto pb-14 md:pb-0">{children}</main>
      </div>
      <MobileNav />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
