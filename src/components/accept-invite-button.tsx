"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import { acceptStaffInviteAction } from "@/server/staff/actions";

interface AcceptInviteButtonProps {
  token: string;
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsLoading(true);
    setError(null);

    const res = await acceptStaffInviteAction(token);

    if (!res.success) {
      setError(res.error || "Failed to accept staff invitation.");
      setIsLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 text-xs bg-red-950/60 border border-red-700/60 text-red-300 rounded-lg text-left">
          {error}
        </div>
      )}

      <Button
        type="button"
        onClick={handleAccept}
        disabled={isLoading}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-5 text-sm shadow-md"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying Credentials & Granting Admin Access...
          </>
        ) : (
          <>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Accept Staff Invitation & Activate Admin Access
          </>
        )}
      </Button>
    </div>
  );
}
