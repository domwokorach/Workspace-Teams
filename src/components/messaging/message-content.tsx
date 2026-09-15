"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";

function splitCodeBlocks(content: string) {
  const parts: { type: "text" | "code"; content: string; language?: string }[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", language: match[1] || "text", content: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }
  return parts;
}

function CodeBlock({ language, content }: { language: string; content: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="my-1.5 overflow-hidden rounded-md border">
      <div className="flex items-center justify-between bg-muted/40 px-2.5 py-1 text-[10px] text-muted-foreground">
        <span className="font-mono uppercase">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 hover:text-foreground">
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-muted/20 p-2.5 font-mono text-xs">
        <code>{content}</code>
      </pre>
    </div>
  );
}

export function MessageContent({ content }: { content: string }) {
  const parts = splitCodeBlocks(content);
  return (
    <div className="text-sm">
      {parts.map((part, i) =>
        part.type === "code" ? (
          <CodeBlock key={i} language={part.language ?? "text"} content={part.content} />
        ) : (
          <span key={i} className="whitespace-pre-wrap">{part.content}</span>
        ),
      )}
    </div>
  );
}
