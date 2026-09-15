"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SocketProvider } from "@/providers/socket-provider";

/** Composes the client-side providers the workspace shell needs, in dependency order. */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SocketProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}
