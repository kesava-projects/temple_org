"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Smartphone, Loader2, CheckCircle2 } from "lucide-react";

export function DevoteeLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackURL") || "/account/bookings";

  const [activeTab, setActiveTab] = useState<"otp" | "social">("otp");

  // Phone OTP State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatPhoneNumber = (input: string) => {
    // Strip non-digits
    const digits = input.replace(/\D/g, "");
    // If it starts with 91 and has 12 digits, keep it; if 10 digits, prepend +91
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    if (digits.length === 12 && digits.startsWith("91")) {
      return `+${digits}`;
    }
    return input.startsWith("+") ? input : `+${digits}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const fullPhone = formatPhoneNumber(phoneNumber);
    if (!/^\+91[6-9]\d{9}$/.test(fullPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number (+91).");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authClient.phoneNumber.sendOtp({
        phoneNumber: fullPhone,
      });

      if (res.error) {
        setError(res.error.message || "Failed to dispatch SMS OTP. Please try again.");
      } else {
        setOtpSent(true);
        setCountdown(60);
        setSuccessMsg(`Sacred verification OTP dispatched to ${fullPhone}. Valid for 10 minutes.`);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Please check the phone number or try social sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullPhone = formatPhoneNumber(phoneNumber);
    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit OTP code received via SMS.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authClient.phoneNumber.verify({
        phoneNumber: fullPhone,
        code: otpCode.trim(),
      });

      if (res.error) {
        setError(res.error.message || "Invalid or expired OTP code.");
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("Verification failed. Please check the OTP code.");
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "facebook" | "apple") => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn.social({
        provider,
        callbackURL: callbackUrl,
      });
    } catch (err) {
      console.error(err);
      setError(`Failed to authenticate with ${provider}. Please try another login method.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex rounded-xl bg-amber-100/60 p-1 border border-amber-900/10 text-xs font-semibold text-stone-600">
        <button
          type="button"
          onClick={() => {
            setActiveTab("otp");
            setError(null);
          }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "otp"
              ? "bg-white text-amber-900 shadow-xs font-bold"
              : "hover:text-stone-900"
          }`}
        >
          <Smartphone className="h-3.5 w-3.5" />
          Mobile SMS OTP
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("social");
            setError(null);
          }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "social"
              ? "bg-white text-amber-900 shadow-xs font-bold"
              : "hover:text-stone-900"
          }`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
          </svg>
          Social Accounts
        </button>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3 text-xs bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab 1: Phone OTP Login */}
      {activeTab === "otp" && (
        <div className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone-number" className="text-xs font-semibold text-stone-700">
                  Mobile Number (India)
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-semibold text-stone-500">
                    +91
                  </div>
                  <Input
                    id="phone-number"
                    type="tel"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phoneNumber.replace(/^\+91/, "")}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-11 text-xs font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-stone-500">
                  Enter your 10-digit mobile number to receive a one-time login passcode via MSG91 SMS.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading || phoneNumber.replace(/\D/g, "").length < 10}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-medium py-2.5 text-xs shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Sending Sacred OTP...
                  </>
                ) : (
                  <>
                    <Phone className="mr-1.5 h-3.5 w-3.5" />
                    Send Verification Code (OTP)
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="otp-code" className="text-xs font-semibold text-stone-700">
                    Enter 6-Digit OTP Code
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                      setError(null);
                    }}
                    className="text-[11px] text-amber-800 hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <Input
                  id="otp-code"
                  type="text"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="font-mono tracking-widest text-center text-sm py-2 font-bold"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || otpCode.trim().length !== 6}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-medium py-2.5 text-xs shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  "Verify & Sign In"
                )}
              </Button>

              <div className="text-center pt-1">
                {countdown > 0 ? (
                  <span className="text-[11px] text-stone-400">
                    Resend OTP available in {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[11px] text-amber-800 font-semibold hover:underline"
                  >
                    Resend Verification Code
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: Social OAuth Sign In (Google, Facebook, Apple) */}
      {activeTab === "social" && (
        <div className="space-y-3">
          {/* Google */}
          <Button
            type="button"
            onClick={() => handleSocialSignIn("google")}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-xs py-5"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-xs font-semibold">Continue with Google</span>
          </Button>

          {/* Facebook */}
          <Button
            type="button"
            onClick={() => handleSocialSignIn("facebook")}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] text-white py-5 shadow-xs"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-xs font-semibold">Continue with Facebook</span>
          </Button>

          {/* Apple */}
          <Button
            type="button"
            onClick={() => handleSocialSignIn("apple")}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-black hover:bg-stone-900 text-white py-5 shadow-xs"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.18c.65-.8 1.09-1.91.97-3.03-.94.04-2.07.63-2.74 1.42-.59.68-1.11 1.79-.97 2.89 1.05.08 2.1-.5 2.74-1.28" />
            </svg>
            <span className="text-xs font-semibold">Continue with Apple</span>
          </Button>
        </div>
      )}
    </div>
  );
}
