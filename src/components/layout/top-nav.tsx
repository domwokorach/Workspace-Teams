"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Bell, Video, GitBranch, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NAV_ITEMS } from "./nav-items";

interface TopNavProps {
  unreadNotifications: number;
  githubConnected: boolean;
  onOpenCommandPalette: () => void;
}

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Dashboard", href: "/dashboard" }];
  return segments.map((seg, i) => ({
    label: seg
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));
}

export function TopNav({ unreadNotifications, githubConnected, onOpenCommandPalette }: TopNavProps) {
  const crumbs = useBreadcrumbs();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3 md:px-4">
      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" />}
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <nav className="flex flex-col gap-0.5 p-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium hover:bg-accent"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm text-muted-foreground sm:flex">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            <Link href={c.href} className="truncate hover:text-foreground">
              {c.label}
            </Link>
          </span>
        ))}
      </nav>

      <button
        onClick={onOpenCommandPalette}
        className="ml-auto flex w-full max-w-sm items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted sm:ml-4"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search repositories, files, issues…</span>
        <span className="ml-auto hidden items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] sm:flex">
          <span>⌘</span>K
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1 sm:ml-0">
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 text-xs md:flex"
          render={<Link href="/settings" />}
        >
          <GitBranch className="size-3.5" />
          {githubConnected ? "Connected" : "Connect GitHub"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Start video call"
          render={<Link href="/calls" />}
        >
          <Video className="size-4.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
          render={<Link href="/notifications" />}
        >
          <Bell className="size-4.5" />
          {unreadNotifications > 0 && (
            <Badge className="absolute -right-1 -top-1 size-4 justify-center rounded-full p-0 text-[10px]">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}
