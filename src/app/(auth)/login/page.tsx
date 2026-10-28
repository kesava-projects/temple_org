import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DevoteeLoginForm } from "@/components/devotee-login-form";

export default function DevoteeLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-amber-100/30 to-amber-50/60 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-700 text-white font-serif text-2xl shadow-md">
            ॐ
          </div>
        </Link>
        <h2 className="text-center font-serif text-3xl font-extrabold tracking-tight text-stone-900">
          Devotee Portal Sign In
        </h2>
        <p className="mt-2 text-center text-xs text-stone-600 max-w-sm mx-auto">
          Sign in via SMS OTP or your verified social account to view puja bookings, download official tax-exempt receipts, and manage seva sankalpams.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-amber-900/10 sm:px-10 space-y-6">
          <Suspense
            fallback={
              <div className="py-8 text-center text-xs text-stone-400">
                Loading devotee authentication portal...
              </div>
            }
          >
            <DevoteeLoginForm />
          </Suspense>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-amber-900/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-stone-400 text-[10px]">Sacred Trust & Security</span>
            </div>
          </div>

          <div className="text-xs text-stone-500 text-center leading-relaxed">
            By continuing, you agree to Sri Venkateswara Temple Trust&apos;s{" "}
            <Link href="/terms" className="text-amber-800 underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-amber-800 underline">
              Privacy Policy
            </Link>.
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-amber-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Temple Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
