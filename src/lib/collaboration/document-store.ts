/**
 * Per-file document state for a live coding session (Phase 2+). Kept
 * dependency-free for now; swap the internals for a CRDT (e.g. Yjs) in
 * `yjs.ts` once concurrent editing is wired up without changing this contract.
 */
export interface DocumentSnapshot {
  filePath: string;
  content: string;
  version: number;
}

const documents = new Map<string, DocumentSnapshot>();

export function getDocument(filePath: string): DocumentSnapshot | undefined {
  return documents.get(filePath);
}

export function applyEdit(filePath: string, content: string): DocumentSnapshot {
  const previous = documents.get(filePath);
  const snapshot: DocumentSnapshot = {
    filePath,
    content,
    version: (previous?.version ?? 0) + 1,
  };
  documents.set(filePath, snapshot);
  return snapshot;
}
