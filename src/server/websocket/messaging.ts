import type { Server, Socket } from "socket.io";
import { rooms } from "@/lib/realtime/rooms";
import type { MessageSummary } from "@/types/message";

export function registerMessagingHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId as string;

  socket.on("channel:join", (channelId: string) => {
    socket.join(rooms.channel(channelId));
  });

  socket.on("channel:leave", (channelId: string) => {
    socket.leave(rooms.channel(channelId));
  });

  socket.on("message:new", (message: MessageSummary) => {
    io.to(rooms.channel(message.channelId)).emit("message:new", message);
  });

  socket.on("message:update", (message: MessageSummary) => {
    io.to(rooms.channel(message.channelId)).emit("message:update", message);
  });

  socket.on("message:delete", (payload: { channelId: string; messageId: string }) => {
    io.to(rooms.channel(payload.channelId)).emit("message:delete", payload);
  });

  socket.on("typing:start", (channelId: string) => {
    socket.to(rooms.channel(channelId)).emit("typing:start", { channelId, userId });
  });

  socket.on("typing:stop", (channelId: string) => {
    socket.to(rooms.channel(channelId)).emit("typing:stop", { channelId, userId });
  });
}
