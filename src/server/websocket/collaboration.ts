import type { Server, Socket } from "socket.io";
import { rooms } from "@/lib/realtime/rooms";
import { applyEdit } from "@/lib/collaboration/document-store";
import type { CursorPosition } from "@/types/collaboration";

export function registerCollaborationHandlers(io: Server, socket: Socket) {
  socket.on("coding:join", (sessionId: string) => {
    socket.join(rooms.coding(sessionId));
  });

  socket.on("coding:leave", (sessionId: string) => {
    socket.leave(rooms.coding(sessionId));
  });

  socket.on(
    "code:update",
    (payload: { sessionId: string; filePath: string; content: string }) => {
      const snapshot = applyEdit(payload.filePath, payload.content);
      socket.to(rooms.coding(payload.sessionId)).emit("code:update", snapshot);
    },
  );

  socket.on("cursor:update", (payload: { sessionId: string } & CursorPosition) => {
    socket.to(rooms.coding(payload.sessionId)).emit("cursor:update", payload);
  });
}
