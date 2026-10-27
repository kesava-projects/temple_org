import { z } from "zod";

export const PhoneLoginSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "Phone number must include country code (e.g. +919876543210)"),
});

export const VerifyOtpSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "Phone number must include country code"),
  otp: z.string().trim().length(6, "OTP must be 6 digits"),
});

export const StaffInviteCreateSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
});

export const AcceptStaffInviteSchema = z.object({
  token: z.string().trim().min(1, "Invite token is required"),
});

export type PhoneLoginInput = z.infer<typeof PhoneLoginSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type StaffInviteCreateInput = z.infer<typeof StaffInviteCreateSchema>;
export type AcceptStaffInviteInput = z.infer<typeof AcceptStaffInviteSchema>;
