"use client";

import { useEffect } from "react";

interface WorkspaceShortcuts {
  onToggleSidebar?: () => void;
  onToggleBottomPanel?: () => void;
}

/**
 * Cmd/Ctrl+B toggles the sidebar, Cmd/Ctrl+J toggles the bottom panel —
 * mirrors VS Code. Buttons must still be provided for the same actions;
 * these shortcuts are a supplement, never the only way to trigger them.
 */
export function useWorkspaceShortcuts({ onToggleSidebar, onToggleBottomPanel }: WorkspaceShortcuts) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === "b" && onToggleSidebar) {
        e.preventDefault();
        onToggleSidebar();
      } else if (e.key.toLowerCase() === "j" && onToggleBottomPanel) {
        e.preventDefault();
        onToggleBottomPanel();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onToggleSidebar, onToggleBottomPanel]);
}
