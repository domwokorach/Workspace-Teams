import type { Socket } from "socket.io-client";
import type { VideoSignal } from "@/types/video";

/** Thin wrapper for sending/receiving WebRTC signals over the shared realtime socket. */
export function sendVideoSignal(socket: Socket, signal: VideoSignal) {
  socket.emit("video:signal", signal);
}

export function onVideoSignal(socket: Socket, handler: (signal: VideoSignal) => void) {
  socket.on("video:signal", handler);
  return () => socket.off("video:signal", handler);
}
