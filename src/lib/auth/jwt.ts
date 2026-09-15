import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 30;

function getSecret(name: "ACCESS" | "REFRESH") {
  const key =
    name === "ACCESS"
      ? process.env.JWT_ACCESS_SECRET
      : process.env.JWT_REFRESH_SECRET;
  if (!key) {
    throw new Error(`Missing JWT_${name}_SECRET environment variable`);
  }
  return new TextEncoder().encode(key);
}

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: string;
}

export async function signAccessToken(
  payload: Omit<AccessTokenPayload, "iat" | "exp">,
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSecret("ACCESS"));
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify<AccessTokenPayload>(
    token,
    getSecret("ACCESS"),
  );
  return payload;
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  tokenId: string;
}

export function refreshTokenExpiry() {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function signRefreshToken(
  payload: Omit<RefreshTokenPayload, "iat" | "exp">,
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL_DAYS}d`)
    .sign(getSecret("REFRESH"));
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify<RefreshTokenPayload>(
    token,
    getSecret("REFRESH"),
  );
  return payload;
}
