import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken, refreshTokenExpiry } from "@/lib/auth/jwt";
import { sha256Hex } from "@/lib/auth/crypto";
import { setAuthCookies } from "@/lib/auth/cookies";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { allowed } = rateLimit(clientKeyFromRequest(request, "login"), {
    limit: 10,
    windowMs: 60_000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, password, rememberMe } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const genericError = NextResponse.json(
    { error: "Invalid email or password." },
    { status: 401 },
  );

  if (!user) return genericError;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return genericError;

  await prisma.user.update({
    where: { id: user.id },
    data: { status: "ONLINE" },
  });

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshTokenId = crypto.randomUUID();
  const refreshToken = await signRefreshToken({
    sub: user.id,
    tokenId: refreshTokenId,
  });

  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      tokenHash: sha256Hex(refreshToken),
      userId: user.id,
      expiresAt: refreshTokenExpiry(),
    },
  });

  const res = NextResponse.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  });
  setAuthCookies(res, { accessToken, refreshToken, rememberMe });
  return res;
}
