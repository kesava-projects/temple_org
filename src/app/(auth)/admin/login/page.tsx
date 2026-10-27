"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ShieldCheck, ArrowLeft, Lock } from "lucide-react";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getErrorDisplay = () => {
    if (errorMsg) return errorMsg;
    if (errorParam === "account_deactivated") {
      return "Your administrator account has been deactivated. Please contact the head trustee.";
    }
    if (errorParam === "forbidden") {
      return "Access denied. Only registered temple staff with an active admin role can access this portal.";
    }
    return null;
  };

  const handleStaffGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/admin",
      });
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to authenticate with Google. Please check your credentials.");
      setIsLoading(false);
    }
  };

  const currentError = getErrorDisplay();

  return (
    <div className="bg-stone-800/90 border border-stone-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 space-y-6">
      {/* Security Notice */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 text-xs text-amber-200/90 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-amber-300">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <span>Strict Security Notice</span>
        </div>
        <p className="leading-relaxed">
          Nobody becomes an admin by signing up. Access is strictly invite-only. If you are a devotee looking to book pujas, please visit the main website.
        </p>
      </div>

      {currentError && (
        <div className="p-3 text-xs bg-red-950/60 border border-red-700/60 text-red-300 rounded-lg">
          {currentError}
        </div>
      )}

      <div className="space-y-4">
        <Button
          type="button"
          onClick={handleStaffGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-stone-100 hover:bg-white text-stone-900 font-medium py-5 shadow-sm"
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
          <span>Authenticate with Google Staff Account</span>
        </Button>
      </div>

      <div className="pt-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
          <span>All staff login attempts are monitored and logged to AuditLog.</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-700 text-white font-serif text-2xl shadow-lg border border-amber-500/20">
            <Lock className="h-6 w-6 text-amber-200" />
          </div>
        </div>
        <h2 className="text-center font-serif text-2xl font-bold tracking-tight text-amber-100">
          Temple Staff Administration
        </h2>
        <p className="mt-1.5 text-center text-xs text-stone-400">
          Restricted access for temple trustees, managers, and authorized priests.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense
          fallback={
            <div className="bg-stone-800/90 border border-stone-700/80 p-8 rounded-2xl text-center text-xs text-stone-400">
              Loading staff portal authentication...
            </div>
          }
        >
          <AdminLoginForm />
        </Suspense>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Public Temple Website
          </Link>
        </div>
      </div>
    </div>
  );
}
