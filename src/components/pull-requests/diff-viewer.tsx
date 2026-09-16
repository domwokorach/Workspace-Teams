import { cn } from "@/lib/utils";

interface DiffLine {
  type: "add" | "remove" | "context" | "hunk";
  content: string;
  oldLine?: number;
  newLine?: number;
}

function parsePatch(patch: string): DiffLine[] {
  const lines: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const raw of patch.split("\n")) {
    if (raw.startsWith("@@")) {
      const match = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
      oldLine = match ? Number(match[1]) : 0;
      newLine = match ? Number(match[2]) : 0;
      lines.push({ type: "hunk", content: raw });
      continue;
    }
    if (raw.startsWith("+")) {
      lines.push({ type: "add", content: raw.slice(1), newLine: newLine++ });
    } else if (raw.startsWith("-")) {
      lines.push({ type: "remove", content: raw.slice(1), oldLine: oldLine++ });
    } else {
      lines.push({ type: "context", content: raw.slice(1), oldLine: oldLine++, newLine: newLine++ });
    }
  }
  return lines;
}

export function DiffViewer({ filename, patch, additions, deletions }: {
  filename: string;
  patch: string | null;
  additions: number;
  deletions: number;
}) {
  const lines = patch ? parsePatch(patch) : [];

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2 text-xs">
        <span className="truncate font-mono font-medium">{filename}</span>
        <span className="shrink-0 font-mono">
          <span className="text-emerald-500">+{additions}</span>{" "}
          <span className="text-red-500">-{deletions}</span>
        </span>
      </div>
      {patch ? (
        <div className="overflow-x-auto font-mono text-xs">
          {lines.map((line, i) => (
            <div
              key={i}
              className={cn(
                "flex whitespace-pre px-2 py-0.5",
                line.type === "add" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                line.type === "remove" && "bg-red-500/10 text-red-600 dark:text-red-400",
                line.type === "hunk" && "bg-muted/40 text-muted-foreground",
              )}
            >
              <span className="mr-2 inline-block w-4 shrink-0 select-none opacity-60">
                {line.type === "add" ? "+" : line.type === "remove" ? "-" : ""}
              </span>
              {line.content}
            </div>
          ))}
        </div>
      ) : (
        <p className="p-3 text-xs text-muted-foreground">Binary file or diff not available.</p>
      )}
    </div>
  );
}
