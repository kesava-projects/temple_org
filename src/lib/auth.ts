import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, twoFactor, phoneNumber } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { communications } from "@/server/notifications/communications";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  appName: "Sri Venkateswara Temple Organization",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "development-secret-minimum-32-chars-long-temple-org-security-12345",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder-google-client-secret",
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || "placeholder-facebook-client-id",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "placeholder-facebook-client-secret",
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || "placeholder-apple-client-id",
      clientSecret: process.env.APPLE_CLIENT_SECRET || "placeholder-apple-client-secret",
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "placeholder-microsoft-client-id",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "placeholder-microsoft-client-secret",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "facebook", "apple", "microsoft"],
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
      issuer: "Sri Venkateswara Temple",
    }),
    phoneNumber({
      sendOTP: async ({ phoneNumber: phoneNum, code }) => {
        console.log(`[BetterAuth SMS OTP] Dispatching OTP ${code} to ${phoneNum}`);
        try {
          await communications.sendSms(
            phoneNum,
            `Your Sri Venkateswara Temple Organization login verification code is ${code}. Valid for 10 minutes. Do not share this OTP.`
          );
        } catch (err) {
          console.error("[BetterAuth SMS OTP Error]", err);
        }
      },
    }),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
export type SessionUser = typeof auth.$Infer.Session.user;
