import { randomBytes, timingSafeEqual } from "node:crypto";

const CSRF_TOKEN_BYTES = 32;

export function generateCsrfToken() {
  return randomBytes(CSRF_TOKEN_BYTES).toString("hex");
}

export function verifyCsrfToken(cookieToken: string | undefined, headerToken: string | undefined) {
  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
}
