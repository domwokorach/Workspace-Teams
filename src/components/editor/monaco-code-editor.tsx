"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";

export function MonacoCodeEditor({
  path,
  value,
  language,
  readOnly,
  onChange,
  onMount,
}: {
  path: string;
  value: string;
  language: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onMount?: OnMount;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <Editor
      key={path}
      path={path}
      value={value}
      language={language}
      theme={resolvedTheme === "light" ? "light" : "vs-dark"}
      onChange={(v) => onChange?.(v ?? "")}
      onMount={onMount}
      loading={
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      }
      options={{
        readOnly,
        minimap: { enabled: true },
        fontSize: 13,
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        lineNumbers: "on",
        folding: true,
        bracketPairColorization: { enabled: true },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: "off",
        renderWhitespace: "selection",
      }}
    />
  );
}
