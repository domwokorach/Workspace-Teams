"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";

interface TerminalInputProps {
  onSubmit: (command: string) => void;
  onClear: () => void;
  history: string[];
  disabled?: boolean;
}

export function TerminalInput({ onSubmit, onClear, history, disabled }: TerminalInputProps) {
  const [value, setValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      const command = value.trim();
      if (command) {
        onSubmit(command);
        setValue("");
        setHistoryIndex(null);
      }
      return;
    }

    if (event.key === "l" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onClear();
      return;
    }

    if (event.key === "ArrowUp") {
      if (history.length === 0) return;
      event.preventDefault();
      const nextIndex = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setValue(history[nextIndex] ?? "");
      return;
    }

    if (event.key === "ArrowDown") {
      if (historyIndex === null) return;
      event.preventDefault();
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(null);
        setValue("");
      } else {
        setHistoryIndex(nextIndex);
        setValue(history[nextIndex] ?? "");
      }
    }
  }

  return (
    <div
      className="flex shrink-0 items-center gap-2 border-t border-border/60 px-3.5 py-2.5 font-mono text-sm sm:px-4"
      onClick={() => inputRef.current?.focus()}
    >
      <span className="select-none text-emerald-600 dark:text-emerald-400" aria-hidden="true">
        $
      </span>
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          value={value}
          aria-label="Terminal command input"
          placeholder="Type a command…"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full min-w-0 border-none bg-transparent text-transparent caret-emerald-500 outline-none disabled:opacity-50"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center">
          {value.length > 0 ? (
            <span className="text-foreground">{value}</span>
          ) : (
            <span className="text-muted-foreground/60">
              {focused ? "" : "Type a command…"}
            </span>
          )}
          {focused && (
            <span className="ml-px inline-block h-4 w-1.5 animate-pulse bg-foreground/70" />
          )}
        </div>
      </div>
    </div>
  );
}
