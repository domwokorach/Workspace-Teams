import type { TerminalEntry, TerminalLine } from "./types";

let lineId = 0;
function nextLineId() {
  lineId += 1;
  return `line-${lineId}`;
}

function line(kind: TerminalLine["kind"], content: string): TerminalLine {
  return { id: nextLineId(), kind, content };
}

const CANNED_RESPONSES: Record<string, TerminalLine[]> = {
  "pnpm install": [line("success", "✓ Dependencies installed")],
  "pnpm dev": [
    line("info", "▲ Next.js development server"),
    line("success", "✓ Ready in 1.8s"),
    line("info", "- Local: http://localhost:3000"),
  ],
  "git status": [
    line("stdout", "On branch main"),
    line("stdout", "nothing to commit, working tree clean"),
  ],
  "npm run build": [
    line("success", "✓ Compiled successfully"),
    line("success", "✓ Type checking passed"),
    line("success", "✓ Build completed"),
  ],
  help: [
    line("stdout", "Available commands:"),
    line("stdout", "  pnpm install, pnpm dev, git status, npm run build, clear, help"),
  ],
};

export function runCommand(rawCommand: string): TerminalLine[] {
  const command = rawCommand.trim();
  const canned = CANNED_RESPONSES[command];
  if (canned) {
    return canned.map((entry) => ({ ...entry, id: nextLineId() }));
  }
  const [bin] = command.split(/\s+/);
  return [line("stderr", `command not found: ${bin || command}`)];
}

export function createEntry(command: string): TerminalEntry {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    command,
    output: runCommand(command),
  };
}

interface CommandToken {
  text: string;
  kind: "bin" | "flag" | "arg";
}

export function tokenizeCommand(command: string): CommandToken[] {
  return command.split(/(\s+)/).reduce<CommandToken[]>((tokens, part) => {
    if (part.trim() === "") {
      if (part) tokens.push({ text: part, kind: "arg" });
      return tokens;
    }
    const isFirst = tokens.filter((t) => t.text.trim()).length === 0;
    if (isFirst) {
      tokens.push({ text: part, kind: "bin" });
    } else if (part.startsWith("-")) {
      tokens.push({ text: part, kind: "flag" });
    } else {
      tokens.push({ text: part, kind: "arg" });
    }
    return tokens;
  }, []);
}
