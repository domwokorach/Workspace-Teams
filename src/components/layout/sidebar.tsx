"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, ChevronsLeft, ChevronsRight, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV_ITEMS } from "./nav-items";
import { UserMenu } from "./user-menu";
import type { CurrentUser } from "@/lib/auth/session";

interface RepoLite {
  id: string;
  name: string;
  owner: string;
  isPrivate: boolean;
}

interface SidebarProps {
  user: CurrentUser;
  workspaceName: string | null;
  recentRepositories: RepoLite[];
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ user, workspaceName, recentRepositories, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Code2 className="size-4" />
        </div>
        {!collapsed && (
          <span className="truncate font-mono text-sm font-semibold">
            {workspaceName ?? "Workspace"}
          </span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto hidden shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const link = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
            return (
              <li key={item.label}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger render={link} />
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </li>
            );
          })}
        </ul>

        {recentRepositories.length > 0 && (
          <div className="mt-6">
            {!collapsed && (
              <p className="px-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Repositories
              </p>
            )}
            <ul className="mt-1 space-y-0.5">
              {recentRepositories.map((repo) => {
                const href = `/repositories/${repo.id}`;
                const active = pathname.startsWith(href);
                return (
                  <li key={repo.id}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      {repo.isPrivate ? (
                        <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      {!collapsed && <span className="truncate font-mono text-xs">{repo.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      <div className="border-t p-2">
        <UserMenu user={user} collapsed={collapsed} />
      </div>
    </aside>
  );
}
