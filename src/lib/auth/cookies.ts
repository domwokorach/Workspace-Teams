import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "swe_access_token";
export const REFRESH_COOKIE = "swe_refresh_token";

const isProd = process.env.NODE_ENV === "production";

export function setAuthCookies(
  res: NextResponse,
  tokens: { accessToken: string; refreshToken: string; rememberMe?: boolean },
) {
  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };

  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    maxAge: 15 * 60,
  });

  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    maxAge: tokens.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
}
