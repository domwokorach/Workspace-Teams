"use client";

import { useEffect, useState } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

/**
 * mobile: <768px (bottom nav / sheets / tabs, never resizable columns)
 * tablet: 768–1023px (one resizable split at a time, rest in drawers)
 * desktop: >=1024px (full nested resizable layout)
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const tabletQuery = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");

    function update() {
      if (mobileQuery.matches) setBreakpoint("mobile");
      else if (tabletQuery.matches) setBreakpoint("tablet");
      else setBreakpoint("desktop");
    }

    update();
    mobileQuery.addEventListener("change", update);
    tabletQuery.addEventListener("change", update);
    return () => {
      mobileQuery.removeEventListener("change", update);
      tabletQuery.removeEventListener("change", update);
    };
  }, []);

  return breakpoint;
}
