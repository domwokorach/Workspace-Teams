"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

/** Tracks which userIds are present in a workspace room over an already-connected socket (Phase 2+). */
export function usePresence(socket: Socket | null, workspaceId: string) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    socket.emit("presence:join", workspaceId);

    const onJoin = ({ userId }: { userId: string }) =>
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    const onLeave = ({ userId }: { userId: string }) =>
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });

    socket.on("presence:join", onJoin);
    socket.on("presence:leave", onLeave);

    return () => {
      socket.emit("presence:leave", workspaceId);
      socket.off("presence:join", onJoin);
      socket.off("presence:leave", onLeave);
    };
  }, [socket, workspaceId]);

  return onlineUserIds;
}
