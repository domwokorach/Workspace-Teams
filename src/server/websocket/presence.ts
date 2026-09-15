import type { Server, Socket } from "socket.io";
import { rooms } from "@/lib/realtime/rooms";

export function registerPresenceHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId as string;

  socket.on("presence:join", (workspaceId: string) => {
    socket.join(rooms.workspace(workspaceId));
    io.to(rooms.workspace(workspaceId)).emit("presence:join", { userId });
  });

  socket.on("presence:leave", (workspaceId: string) => {
    socket.leave(rooms.workspace(workspaceId));
    io.to(rooms.workspace(workspaceId)).emit("presence:leave", { userId });
  });

  socket.on("disconnect", () => {
    for (const room of socket.rooms) {
      io.to(room).emit("presence:leave", { userId });
    }
  });
}
