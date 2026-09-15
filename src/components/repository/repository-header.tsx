"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Globe, GitBranch, CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Repository } from "@/generated/prisma/client";

const TABS = [
  { label: "Code", segment: "" },
  { label: "Issues", segment: "issues" },
  { label: "Pull Requests", segment: "pull-requests" },
  { label: "Tests", segment: "tests" },
  { label: "Contributors", segment: "contributors" },
  { label: "Activity", segment: "activity" },
];

export function RepositoryHeader({ repository }: { repository: Repository }) {
  const pathname = usePathname();
  const base = `/repositories/${repository.id}`;

  return (
    <div className="border-b bg-background">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 md:px-6">
        <h1 className="font-mono text-sm font-semibold">
          <span className="text-muted-foreground">{repository.owner}</span>
          <span className="mx-1 text-muted-foreground">/</span>
          {repository.name}
        </h1>
        {repository.isPrivate ? (
          <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            <Lock className="size-3" /> Private
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            <Globe className="size-3" /> Public
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <GitBranch className="size-3.5" /> {repository.defaultBranch}
        </span>
        <span className="flex items-center gap-1 text-xs text-emerald-500">
          <CheckCircle2 className="size-3.5" /> synced
        </span>
        {repository.githubUrl && (
          <a
            href={repository.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3.5" /> View on GitHub
          </a>
        )}
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 md:px-6">
        {TABS.map((tab) => {
          const href = tab.segment ? `${base}/${tab.segment}` : base;
          const active = tab.segment ? pathname.startsWith(href) : pathname === base;
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
