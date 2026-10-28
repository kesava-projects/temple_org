"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Loader2 } from "lucide-react";
import {
  deactivateStaffAction,
  reactivateStaffAction,
  demoteStaffAction,
} from "@/server/staff/actions";

interface StaffActionButtonProps {
  staffId: string;
  staffName: string;
  staffEmail: string;
  isActive: boolean;
  isSoleAdmin: boolean;
  currentUserIsTarget: boolean;
}

export function StaffActionButton({
  staffId,
  staffName,
  staffEmail,
  isActive,
  isSoleAdmin,
  currentUserIsTarget,
}: StaffActionButtonProps) {
  const [modalMode, setModalMode] = useState<"deactivate" | "demote" | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeactivate = async () => {
    setIsLoading(true);
    setError(null);

    const res = await deactivateStaffAction(staffId, totpCode.trim() || undefined);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to deactivate administrator.");
      return;
    }

    setModalMode(null);
    setTotpCode("");
  };

  const handleReactivate = async () => {
    setIsLoading(true);
    setError(null);

    const res = await reactivateStaffAction(staffId);
    setIsLoading(false);

    if (!res.success) {
      alert(res.error || "Failed to reactivate administrator.");
    }
  };

  const handleDemote = async () => {
    setIsLoading(true);
    setError(null);

    const res = await demoteStaffAction(staffId, totpCode.trim() || undefined);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to demote staff member.");
      return;
    }

    setModalMode(null);
    setTotpCode("");
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        {isActive ? (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isSoleAdmin}
              onClick={() => {
                setError(null);
                setTotpCode("");
                setModalMode("deactivate");
              }}
              title={isSoleAdmin ? "Cannot deactivate the last remaining active administrator." : undefined}
              className="h-7 text-[11px] text-amber-900 border-amber-300 hover:bg-amber-50"
            >
              Deactivate
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isSoleAdmin}
              onClick={() => {
                setError(null);
                setTotpCode("");
                setModalMode("demote");
              }}
              title={isSoleAdmin ? "Cannot demote the last remaining active administrator." : undefined}
              className="h-7 text-[11px] text-stone-600 border-stone-200 hover:bg-stone-50"
            >
              Demote
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReactivate}
            disabled={isLoading}
            className="h-7 text-[11px] text-emerald-800 border-emerald-300 hover:bg-emerald-50"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reactivate"}
          </Button>
        )}
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                {modalMode === "deactivate"
                  ? "Deactivate Staff Administrator"
                  : "Demote Administrator to Devotee"}
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Are you sure you want to {modalMode} <strong>{staffName}</strong> (
              <span className="font-mono">{staffEmail}</span>)?
              {modalMode === "deactivate" && (
                <span className="block mt-1 text-amber-800 font-medium">
                  All active login sessions for this user will be invalidated immediately.
                </span>
              )}
              {currentUserIsTarget && (
                <span className="block mt-1 text-red-700 font-medium">
                  Warning: You are performing this action on your own account.
                </span>
              )}
            </p>

            {error && (
              <div className="p-2.5 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700 flex justify-between">
                <span>Admin TOTP Code</span>
                <span className="text-[10px] text-stone-400 font-normal">If 2FA enforced</span>
              </Label>
              <Input
                type="text"
                maxLength={6}
                placeholder="6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="text-xs font-mono tracking-widest"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalMode(null)}
                disabled={isLoading}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={modalMode === "deactivate" ? handleDeactivate : handleDemote}
                disabled={isLoading}
                className={`text-xs text-white ${
                  modalMode === "deactivate"
                    ? "bg-amber-700 hover:bg-amber-800"
                    : "bg-red-700 hover:bg-red-800"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  `Confirm ${modalMode === "deactivate" ? "Deactivation" : "Demotion"}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
