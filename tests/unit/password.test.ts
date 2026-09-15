import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, scorePasswordStrength } from "@/lib/auth/password";

describe("password hashing", () => {
  it("hashes and verifies correctly", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("never stores the password in plaintext", async () => {
    const hash = await hashPassword("mypassword123");
    expect(hash).not.toBe("mypassword123");
  });
});

describe("scorePasswordStrength", () => {
  it("scores a short simple password as weak", () => {
    const result = scorePasswordStrength("abc");
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("scores a long mixed-case password with numbers and symbols as strong", () => {
    const result = scorePasswordStrength("Tr0ub4dor&3xtra!");
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it("lists specific missing criteria as issues", () => {
    const result = scorePasswordStrength("alllowercase");
    expect(result.issues).toContain("At least one number");
    expect(result.issues).toContain("At least one symbol");
  });
});
