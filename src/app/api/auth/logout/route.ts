import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { verifyRefreshToken } from "@/lib/auth/jwt";
import { clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth/cookies";

export async function POST() {
  const store = await cookies();
  const token = store.get(REFRESH_COOKIE)?.value;

  if (token) {
    try {
      const payload = await verifyRefreshToken(token);
      await prisma.refreshToken.updateMany({
        where: { id: payload.tokenId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await prisma.user.update({
        where: { id: payload.sub },
        data: { status: "OFFLINE" },
      }).catch(() => {});
    } catch {
      // Token already invalid — nothing to revoke.
    }
  }

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
