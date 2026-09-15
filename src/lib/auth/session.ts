import "server-only";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "./cookies";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt";
import { prisma } from "@/lib/db/client";

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  githubUsername: string | null;
  status: string;
  timezone: string;
}

/** Reads and verifies the access token cookie. Returns null if absent/invalid/expired. */
export async function getSessionPayload(): Promise<AccessTokenPayload | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

/** Loads the full current user from the DB based on the access token. Null if unauthenticated. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const payload = await getSessionPayload();
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatarUrl: true,
      githubUsername: true,
      status: true,
      timezone: true,
    },
  });

  return user;
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("UNAUTHENTICATED", "You must be signed in.");
  }
  return user;
}

export class AuthError extends Error {
  code: "UNAUTHENTICATED" | "FORBIDDEN";
  constructor(code: "UNAUTHENTICATED" | "FORBIDDEN", message: string) {
    super(message);
    this.code = code;
  }
}
