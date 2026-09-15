import type { CursorPosition } from "@/types/collaboration";

/** In-memory presence/cursor state for one coding session, keyed by userId (Phase 2+). */
export class AwarenessState {
  private cursors = new Map<string, CursorPosition>();

  setCursor(cursor: CursorPosition) {
    this.cursors.set(cursor.userId, cursor);
  }

  removeUser(userId: string) {
    this.cursors.delete(userId);
  }

  list() {
    return Array.from(this.cursors.values());
  }
}
