import type { Socket } from "socket.io";
import { verifyAccessToken } from "@/lib/auth/jwt";

/** Socket.IO middleware: rejects connections without a valid access token (Phase 2+). */
export async function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth.accessToken as string | undefined;
  if (!token) {
    next(new Error("Missing access token"));
    return;
  }

  try {
    const payload = await verifyAccessToken(token);
    socket.data.userId = payload.sub;
    socket.data.email = payload.email;
    socket.data.role = payload.role;
    next();
  } catch {
    next(new Error("Invalid access token"));
  }
}
