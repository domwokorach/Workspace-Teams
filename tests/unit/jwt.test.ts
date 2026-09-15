import { describe, it, expect, beforeAll } from "vitest";
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth/jwt";

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test-access-secret-0123456789";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-0123456789";
});

describe("jwt", () => {
  it("signs and verifies an access token round-trip", async () => {
    const token = await signAccessToken({ sub: "user_1", email: "a@b.com", role: "DEVELOPER" });
    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe("user_1");
    expect(payload.email).toBe("a@b.com");
    expect(payload.role).toBe("DEVELOPER");
  });

  it("signs and verifies a refresh token round-trip", async () => {
    const token = await signRefreshToken({ sub: "user_1", tokenId: "token_1" });
    const payload = await verifyRefreshToken(token);
    expect(payload.sub).toBe("user_1");
    expect(payload.tokenId).toBe("token_1");
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signAccessToken({ sub: "user_1", email: "a@b.com", role: "DEVELOPER" });
    process.env.JWT_ACCESS_SECRET = "a-completely-different-secret-value";
    await expect(verifyAccessToken(token)).rejects.toThrow();
    process.env.JWT_ACCESS_SECRET = "test-access-secret-0123456789";
  });
});
