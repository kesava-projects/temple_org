import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, twoFactor, phoneNumber } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  appName: "Temple Organization",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "development-secret-minimum-32-chars-long-temple-org-security-12345",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder-google-client-secret",
    },
  },
  session: {
    expiresIn: 60 * 60 * 8, // 8 hours absolute (Security Rule 7)
    updateAge: 60 * 30, // 30 minutes idle (Security Rule 7)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [
    admin({
      defaultRole: "USER",
      adminRole: "ADMIN",
    }),
    twoFactor({
      issuer: "Temple Organization",
    }),
    phoneNumber({
      sendOTP: async ({ phoneNumber: phoneNum, code }) => {
        // In dev, log the OTP; MSG91 provider is integrated in Phase 5
        console.log(`[BetterAuth SMS OTP] Dispatching OTP ${code} to ${phoneNum}`);
      },
    }),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
export type SessionUser = typeof auth.$Infer.Session.user;
