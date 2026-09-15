import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiry,
} from "@/lib/auth/jwt";
import { sha256Hex } from "@/lib/auth/crypto";
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth/cookies";

export async function POST() {
  const store = await cookies();
  const token = store.get(REFRESH_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let payload;
  try {
    payload = await verifyRefreshToken(token);
  } catch {
    const res = NextResponse.json({ error: "Session expired." }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
  });

  // Reuse detection: token not found, already revoked, or hash mismatch
  // means the token was rotated already or is forged — revoke the whole chain.
  if (!stored || stored.revokedAt || stored.tokenHash !== sha256Hex(token)) {
    if (stored && !stored.revokedAt) {
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
    }
    const res = NextResponse.json({ error: "Session invalid." }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    const res = NextResponse.json({ error: "Session invalid." }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const newTokenId = crypto.randomUUID();
  const newRefreshToken = await signRefreshToken({
    sub: user.id,
    tokenId: newTokenId,
  });

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedBy: newTokenId },
    }),
    prisma.refreshToken.create({
      data: {
        id: newTokenId,
        tokenHash: sha256Hex(newRefreshToken),
        userId: user.id,
        expiresAt: refreshTokenExpiry(),
      },
    }),
  ]);

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });
  return res;
}
