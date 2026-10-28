import { describe, it, expect } from "vitest";
import { generateTotpCode, verifyTotpCode } from "@/server/auth/totp";

describe("RFC 6238 TOTP Engine (totp.ts)", () => {
  const sampleSecret = "JBSWY3DPEHPK3PXP"; // Standard Base32 test secret

  it("should generate a 6-digit TOTP code", () => {
    const code = generateTotpCode(sampleSecret);
    expect(code).toMatch(/^\d{6}$/);
  });

  it("should verify valid TOTP code for the current time step", () => {
    const now = Date.now();
    const code = generateTotpCode(sampleSecret, now);
    const isValid = verifyTotpCode(sampleSecret, code, now);
    expect(isValid).toBe(true);
  });

  it("should verify code within ±1 step (30s) clock drift", () => {
    const now = Date.now();
    const prevStepTime = now - 30 * 1000;
    const prevCode = generateTotpCode(sampleSecret, prevStepTime);

    // Should verify valid within default window of 1
    const isValidPrev = verifyTotpCode(sampleSecret, prevCode, now);
    expect(isValidPrev).toBe(true);

    const nextStepTime = now + 30 * 1000;
    const nextCode = generateTotpCode(sampleSecret, nextStepTime);
    const isValidNext = verifyTotpCode(sampleSecret, nextCode, now);
    expect(isValidNext).toBe(true);
  });

  it("should reject expired codes beyond window", () => {
    const now = Date.now();
    const tooOldTime = now - 90 * 1000; // 3 steps back
    const oldCode = generateTotpCode(sampleSecret, tooOldTime);

    const isValid = verifyTotpCode(sampleSecret, oldCode, now, 1);
    expect(isValid).toBe(false);
  });

  it("should reject invalid/malformed codes", () => {
    expect(verifyTotpCode(sampleSecret, "123")).toBe(false);
    expect(verifyTotpCode(sampleSecret, "abcdef")).toBe(false);
    expect(verifyTotpCode(sampleSecret, "999999")).toBe(false);
  });
});
