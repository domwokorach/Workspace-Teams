import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { authenticateSocket } from "@/server/websocket/authentication";
import { registerPresenceHandlers } from "@/server/websocket/presence";
import { registerMessagingHandlers } from "@/server/websocket/messaging";
import { registerCollaborationHandlers } from "@/server/websocket/collaboration";
import { registerVideoSignalingHandlers } from "@/server/websocket/video-signaling";

/**
 * Boots the realtime server (Phase 2+). Vercel Functions can hold WebSocket
 * connections directly (Fluid Compute), so this can run inside a Next.js
 * route via `experimental_upgradeWebSocket()` instead of a separate process —
 * `NEXT_PUBLIC_SOCKET_URL` stays configurable for local dev either way.
 */
export function createSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: process.env.NEXT_PUBLIC_APP_URL, credentials: true },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    registerPresenceHandlers(io, socket);
    registerMessagingHandlers(io, socket);
    registerCollaborationHandlers(io, socket);
    registerVideoSignalingHandlers(io, socket);
  });

  return io;
}
