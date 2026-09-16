"use client";

import { PanelLeft, PanelRight, PanelBottom, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Small icon-button controls every resizable workspace exposes: toggle & reset. */
function ToolbarIconButton({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  icon: React.ElementType;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClick}
            aria-label={label}
            aria-pressed={active}
            className={cn(active === false && "text-muted-foreground")}
          />
        }
      >
        <Icon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function ToggleSidebarButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <ToolbarIconButton
      label={open ? "Hide sidebar (⌘B)" : "Show sidebar (⌘B)"}
      active={open}
      onClick={onToggle}
      icon={PanelLeft}
    />
  );
}

export function ToggleContextPanelButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <ToolbarIconButton
      label={open ? "Hide panel" : "Show panel"}
      active={open}
      onClick={onToggle}
      icon={PanelRight}
    />
  );
}

export function ToggleBottomPanelButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <ToolbarIconButton
      label={open ? "Hide bottom panel (⌘J)" : "Show bottom panel (⌘J)"}
      active={open}
      onClick={onToggle}
      icon={PanelBottom}
    />
  );
}

export function ResetLayoutButton({ onReset }: { onReset: () => void }) {
  return <ToolbarIconButton label="Reset panel layout" onClick={onReset} icon={RotateCcw} />;
}
