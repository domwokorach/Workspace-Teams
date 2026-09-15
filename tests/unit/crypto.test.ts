import { describe, it, expect, beforeAll } from "vitest";
import { encryptSecret, decryptSecret, sha256Hex } from "@/lib/auth/crypto";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = "test-encryption-key-0123456789";
});

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a secret value", () => {
    const encrypted = encryptSecret("gho_supersecrettoken");
    expect(encrypted).not.toContain("gho_supersecrettoken");
    expect(decryptSecret(encrypted)).toBe("gho_supersecrettoken");
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const a = encryptSecret("same-value");
    const b = encryptSecret("same-value");
    expect(a).not.toBe(b);
  });

  it("throws on a tampered payload", () => {
    const encrypted = encryptSecret("gho_supersecrettoken");
    const tampered = encrypted.slice(0, -4) + "XXXX";
    expect(() => decryptSecret(tampered)).toThrow();
  });
});

describe("sha256Hex", () => {
  it("is deterministic", () => {
    expect(sha256Hex("hello")).toBe(sha256Hex("hello"));
  });

  it("differs for different inputs", () => {
    expect(sha256Hex("hello")).not.toBe(sha256Hex("world"));
  });
});
