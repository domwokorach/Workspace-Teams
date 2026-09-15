"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

/** Connects to the realtime server once an access token is available (Phase 2+). No-op until NEXT_PUBLIC_SOCKET_URL is set. */
export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket] = useState<Socket | null>(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL;
    return url ? io(url, { withCredentials: true, autoConnect: true }) : null;
  });

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
