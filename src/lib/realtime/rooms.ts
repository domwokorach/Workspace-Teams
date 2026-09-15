/**
 * Realtime room naming convention shared by the (future) Socket.IO server and
 * clients. Phase 2+ wires an actual `socket.io` server and these room joins;
 * for now this documents the contract so later work doesn't need to invent it.
 */
export const rooms = {
  workspace: (workspaceId: string) => `workspace:${workspaceId}`,
  channel: (channelId: string) => `channel:${channelId}`,
  repository: (repositoryId: string) => `repository:${repositoryId}`,
  coding: (sessionId: string) => `coding:${sessionId}`,
  video: (roomId: string) => `video:${roomId}`,
};

/** Realtime events emitted/consumed across the rooms above (Phase 2+). */
export type RealtimeEvent =
  | "message:new"
  | "message:update"
  | "message:delete"
  | "typing:start"
  | "typing:stop"
  | "presence:join"
  | "presence:leave"
  | "code:update"
  | "cursor:update"
  | "notification:new"
  | "video:join"
  | "video:leave"
  | "video:signal";
