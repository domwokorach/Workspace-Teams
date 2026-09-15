import type { Server, Socket } from "socket.io";
import { rooms } from "@/lib/realtime/rooms";
import type { VideoSignal } from "@/types/video";

export function registerVideoSignalingHandlers(io: Server, socket: Socket) {
  socket.on("video:join", (roomId: string) => {
    socket.join(rooms.video(roomId));
    socket.to(rooms.video(roomId)).emit("video:join", { userId: socket.data.userId });
  });

  socket.on("video:leave", (roomId: string) => {
    socket.leave(rooms.video(roomId));
    socket.to(rooms.video(roomId)).emit("video:leave", { userId: socket.data.userId });
  });

  socket.on("video:signal", (payload: { roomId: string } & VideoSignal) => {
    io.to(rooms.video(payload.roomId)).emit("video:signal", payload);
  });
}
