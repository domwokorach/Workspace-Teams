import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { registerSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken, refreshTokenExpiry } from "@/lib/auth/jwt";
import { sha256Hex } from "@/lib/auth/crypto";
import { setAuthCookies } from "@/lib/auth/cookies";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { allowed } = rateLimit(clientKeyFromRequest(request, "register"), {
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
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { firstName, lastName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { firstName, lastName, email, passwordHash, role: "OWNER", status: "ONLINE" },
  });

  const slugBase = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
  await prisma.workspace.create({
    data: {
      name: `${firstName}'s Workspace`,
      slug: `${slugBase}-${user.id.slice(-6)}`,
      members: { create: { userId: user.id, role: "OWNER" } },
      channels: {
        create: [
          { name: "general", topic: "Company-wide announcements and work-based matters" },
          { name: "engineering", topic: "Engineering discussion" },
        ],
      },
    },
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
  setAuthCookies(res, { accessToken, refreshToken });
  return res;
}
