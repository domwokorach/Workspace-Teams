"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Appearance</CardTitle>
        <CardDescription>Choose how the workspace looks on this device.</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex flex-1 flex-col items-center gap-2 rounded-md border p-4 text-sm transition-colors",
              theme === opt.value ? "border-primary bg-primary/5" : "hover:bg-accent/50",
            )}
          >
            <opt.icon className="size-5" />
            {opt.label}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
