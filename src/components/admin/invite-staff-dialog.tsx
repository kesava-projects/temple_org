"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Copy, Check, ShieldAlert, Loader2 } from "lucide-react";
import { createStaffInviteAction } from "@/server/staff/actions";

export function InviteStaffDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    email: string;
    inviteUrl: string;
    expiresAt: Date;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await createStaffInviteAction({
      email,
      totpCode: totpCode.trim() || undefined,
    });

    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to create staff invitation.");
      return;
    }

    if (res.data) {
      setSuccessResult(res.data);
      setEmail("");
      setTotpCode("");
    }
  };

  const handleCopy = () => {
    if (successResult?.inviteUrl) {
      navigator.clipboard.writeText(successResult.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setSuccessResult(null);
    setEmail("");
    setTotpCode("");
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium shadow-xs"
      >
        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
        Invite New Staff Member
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-amber-900/10 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-amber-900/10 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold">
                  ॐ
                </div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  Invite Staff Administrator
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {successResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Staff Invitation Created & Dispatched</span>
                  </div>
                  <p className="leading-relaxed">
                    An official invitation has been emailed to <strong>{successResult.email}</strong>. This invitation expires in <strong>48 hours</strong> ({new Date(successResult.expiresAt).toLocaleString("en-IN")}).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-stone-600 font-semibold">
                    Direct Invitation URL (Single-use token)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={successResult.inviteUrl}
                      className="font-mono text-xs bg-stone-50 dark:bg-stone-800"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleClose}
                    className="bg-amber-800 hover:bg-amber-900 text-white text-xs"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
                    <span>Security Requirements</span>
                  </div>
                  <p>
                    Staff invites are single-use, valid for 48 hours, and will only be accepted if the invitee authenticates via Google/Microsoft using this exact verified email.
                  </p>
                </div>

                {error && (
                  <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="staff-email" className="text-xs font-semibold text-stone-700">
                    Staff Member&apos;s Email Address *
                  </Label>
                  <Input
                    id="staff-email"
                    type="email"
                    required
                    placeholder="pandit@temple.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="staff-totp" className="text-xs font-semibold text-stone-700 flex items-center justify-between">
                    <span>Admin TOTP Authenticator Code</span>
                    <span className="text-[10px] text-stone-400 font-normal">If 2FA enabled</span>
                  </Label>
                  <Input
                    id="staff-totp"
                    type="text"
                    maxLength={6}
                    placeholder="6-digit authenticator code"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="font-mono tracking-widest text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading || !email}
                    className="bg-amber-700 hover:bg-amber-800 text-white text-xs"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Generating Invite...
                      </>
                    ) : (
                      "Send Official Invitation"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
