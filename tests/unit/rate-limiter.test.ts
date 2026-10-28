import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  _resetMemoryRateLimitStore,
} from "@/server/security/rate-limiter";

describe("Security Rate Limiter (rate-limiter.ts)", () => {
  beforeEach(() => {
    _resetMemoryRateLimitStore();
  });

  it("should enforce auth rate limiting threshold (5 requests per minute)", async () => {
    const ip = "192.168.1.100";

    for (let i = 0; i < 5; i++) {
      const res = await checkRateLimit(ip, "auth");
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(4 - i);
    }

    // 6th attempt should be blocked
    const blocked = await checkRateLimit(ip, "auth");
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.reset).toBeGreaterThan(Date.now());
  });

  it("should enforce OTP rate limiting threshold (3 requests per 5 minutes)", async () => {
    const phone = "+919876543210";

    for (let i = 0; i < 3; i++) {
      const res = await checkRateLimit(phone, "otp");
      expect(res.success).toBe(true);
    }

    const blocked = await checkRateLimit(phone, "otp");
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("should enforce invite rate limiting threshold (5 requests per 10 minutes)", async () => {
    const ip = "10.0.0.1";

    for (let i = 0; i < 5; i++) {
      const res = await checkRateLimit(ip, "invite");
      expect(res.success).toBe(true);
    }

    const blocked = await checkRateLimit(ip, "invite");
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("should enforce booking rate limiting threshold (10 requests per minute)", async () => {
    const ip = "172.16.0.1";

    for (let i = 0; i < 10; i++) {
      const res = await checkRateLimit(ip, "booking");
      expect(res.success).toBe(true);
    }

    const blocked = await checkRateLimit(ip, "booking");
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("should isolate different identifiers independently", async () => {
    const userA = "user-a@temple.org";
    const userB = "user-b@temple.org";

    for (let i = 0; i < 5; i++) {
      await checkRateLimit(userA, "auth");
    }

    const blockedA = await checkRateLimit(userA, "auth");
    expect(blockedA.success).toBe(false);

    // User B should still succeed
    const allowedB = await checkRateLimit(userB, "auth");
    expect(allowedB.success).toBe(true);
  });

  it("should isolate different rate limit types for the same identifier", async () => {
    const identifier = "common-client-ip";

    // Exhaust auth limit
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(identifier, "auth");
    }
    expect((await checkRateLimit(identifier, "auth")).success).toBe(false);

    // Booking limit for the same identifier should still be available
    const bookingRes = await checkRateLimit(identifier, "booking");
    expect(bookingRes.success).toBe(true);
  });
});
