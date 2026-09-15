"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

const TYPING_TIMEOUT_MS = 3000;

/** Tracks other users currently typing in a channel and exposes a debounced emitter (Phase 2+). */
export function useTyping(socket: Socket | null, channelId: string) {
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
  const stopTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    if (!socket) return;

    const onStart = ({ userId }: { userId: string }) => {
      setTypingUserIds((prev) => new Set(prev).add(userId));
      clearTimeout(stopTimers.current.get(userId));
      stopTimers.current.set(
        userId,
        setTimeout(() => {
          setTypingUserIds((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }, TYPING_TIMEOUT_MS),
      );
    };

    socket.on("typing:start", onStart);
    return () => {
      socket.off("typing:start", onStart);
    };
  }, [socket]);

  function notifyTyping() {
    socket?.emit("typing:start", channelId);
  }

  return { typingUserIds, notifyTyping };
}
