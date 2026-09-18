export type TerminalLineKind = "stdout" | "stderr" | "success" | "info";

export interface TerminalLine {
  id: string;
  kind: TerminalLineKind;
  content: string;
}

export interface TerminalEntry {
  id: string;
  command: string;
  output: TerminalLine[];
}

export type TerminalConnectionState = "connected" | "connecting" | "disconnected";
