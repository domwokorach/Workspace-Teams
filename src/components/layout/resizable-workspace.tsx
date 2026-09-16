"use client";

import * as React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useDefaultLayout, type GroupImperativeHandle } from "react-resizable-panels";
import { cn } from "@/lib/utils";

/**
 * localStorage can throw (private browsing, disabled site data, some
 * embedded/sandboxed contexts) — accessing it directly as a prop value would
 * crash the whole workspace on render. Fall back to an in-memory no-op store.
 */
function getSafeStorage(): Pick<Storage, "getItem" | "setItem"> {
  try {
    if (typeof window === "undefined") throw new Error("no window");
    const testKey = "__resizable_workspace_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
    };
  }
}

/** Bare numbers are treated as a percentage of the group; strings pass through as-is (e.g. "64px"). */
type PaneSize = number | string;

function toSize(size: PaneSize | undefined): string | undefined {
  if (size === undefined) return undefined;
  return typeof size === "number" ? `${size}%` : size;
}

export interface ResizablePaneSpec {
  /** Stable id — also used as the persistence key within the group's storage id. */
  id: string;
  content: React.ReactNode;
  /** Percentage (0-100) default size within the group, or an explicit CSS size (e.g. "64px"). */
  defaultSize: PaneSize;
  minSize?: PaneSize;
  maxSize?: PaneSize;
  /** When true the pane is not mounted at all (fully collapsed / hidden). */
  hidden?: boolean;
  className?: string;
}

export interface ResizableSplitHandle {
  /** Restore every visible pane to its `defaultSize`. */
  reset: () => void;
}

interface ResizableSplitProps {
  /** Unique key panel sizes are persisted under (localStorage). */
  storageId: string;
  orientation: "horizontal" | "vertical";
  panes: ResizablePaneSpec[];
  className?: string;
  handleClassName?: string;
  /** Show drag handles (visible grip). Defaults to true. */
  withHandle?: boolean;
}

/**
 * Generic N-pane resizable group with size persistence, sensible min/max
 * clamping, and double-click-to-reset (built into the underlying separator).
 * Reused by every workspace: sidebar/main/context, file explorer/editor,
 * changed-files/diff, list/detail, channels/messages/thread, etc.
 */
export const ResizableSplit = React.forwardRef<ResizableSplitHandle, ResizableSplitProps>(
  function ResizableSplit(
    { storageId, orientation, panes, className, handleClassName, withHandle = true },
    ref,
  ) {
    const visible = panes.filter((p) => !p.hidden);
    const panelIds = visible.map((p) => p.id);
    const storageRef = React.useRef<Pick<Storage, "getItem" | "setItem">>(undefined);
    if (!storageRef.current) storageRef.current = getSafeStorage();

    const { defaultLayout, onLayoutChanged } = useDefaultLayout({
      id: storageId,
      panelIds,
      storage: storageRef.current,
    });

    const groupRef = React.useRef<GroupImperativeHandle>(null);

    React.useImperativeHandle(ref, () => ({
      reset: () => {
        const layout: Record<string, number> = {};
        for (const p of visible) {
          layout[p.id] = typeof p.defaultSize === "number" ? p.defaultSize : 0;
        }
        groupRef.current?.setLayout(layout);
      },
    }));

    return (
      <ResizablePanelGroup
        id={storageId}
        orientation={orientation}
        groupRef={groupRef}
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
        className={cn("h-full w-full", className)}
      >
        {visible.map((pane, i) => (
          <React.Fragment key={pane.id}>
            {i > 0 && <ResizableHandle withHandle={withHandle} className={handleClassName} />}
            <ResizablePanel
              id={pane.id}
              defaultSize={toSize(pane.defaultSize)}
              minSize={toSize(pane.minSize)}
              maxSize={toSize(pane.maxSize)}
              className={cn("min-h-0 min-w-0 overflow-hidden", pane.className)}
            >
              {pane.content}
            </ResizablePanel>
          </React.Fragment>
        ))}
      </ResizablePanelGroup>
    );
  },
);

export interface ResizableWorkspaceProps {
  storageId: string;
  sidebar?: React.ReactNode;
  sidebarOpen?: boolean;
  sidebarDefaultSize?: number;
  sidebarMinSize?: number;
  sidebarMaxSize?: number;
  main: React.ReactNode;
  mainDefaultSize?: number;
  mainMinSize?: number;
  context?: React.ReactNode;
  contextOpen?: boolean;
  contextDefaultSize?: number;
  contextMinSize?: number;
  contextMaxSize?: number;
  className?: string;
}

/**
 * The canonical Sidebar ↔ Main ↔ Context shell used across the app
 * (repositories, issues, pull requests, messages, tests, contributors,
 * live coding). Thin wrapper over `ResizableSplit` — never duplicate the
 * underlying ResizablePanelGroup markup on a page directly.
 */
export const ResizableWorkspace = React.forwardRef<ResizableSplitHandle, ResizableWorkspaceProps>(
  function ResizableWorkspace(
    {
      storageId,
      sidebar,
      sidebarOpen = true,
      sidebarDefaultSize = 18,
      sidebarMinSize = 12,
      sidebarMaxSize = 28,
      main,
      mainDefaultSize = 62,
      mainMinSize = 35,
      context,
      contextOpen = true,
      contextDefaultSize = 20,
      contextMinSize = 15,
      contextMaxSize = 40,
      className,
    },
    ref,
  ) {
    const panes: ResizablePaneSpec[] = [];
    if (sidebar) {
      panes.push({
        id: "sidebar",
        content: sidebar,
        defaultSize: sidebarDefaultSize,
        minSize: sidebarMinSize,
        maxSize: sidebarMaxSize,
        hidden: !sidebarOpen,
      });
    }
    panes.push({
      id: "main",
      content: main,
      defaultSize: sidebar || context ? mainDefaultSize : 100,
      minSize: mainMinSize,
    });
    if (context) {
      panes.push({
        id: "context",
        content: context,
        defaultSize: contextDefaultSize,
        minSize: contextMinSize,
        maxSize: contextMaxSize,
        hidden: !contextOpen,
      });
    }

    return (
      <ResizableSplit
        ref={ref}
        storageId={storageId}
        orientation="horizontal"
        panes={panes}
        className={className}
      />
    );
  },
);
