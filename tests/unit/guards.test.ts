import { describe, it, expect } from "vitest";
import { AuthError } from "@/server/auth/guards";

describe("Auth Guards & Error Handling", () => {
  it("should construct AuthError with appropriate error codes", () => {
    const unauth = new AuthError("Please log in", "UNAUTHENTICATED");
    expect(unauth.message).toBe("Please log in");
    expect(unauth.code).toBe("UNAUTHENTICATED");
    expect(unauth.name).toBe("AuthError");

    const inactive = new AuthError("Account deactivated", "ACCOUNT_INACTIVE");
    expect(inactive.code).toBe("ACCOUNT_INACTIVE");

    const forbidden = new AuthError("Admin required", "FORBIDDEN");
    expect(forbidden.code).toBe("FORBIDDEN");
  });
});
