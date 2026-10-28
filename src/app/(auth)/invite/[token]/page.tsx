import Link from "next/link";
import { getCurrentUser } from "@/server/auth/guards";
import { staffService } from "@/server/staff/staff.service";
import { AcceptInviteButton } from "@/components/accept-invite-button";
import {
  MailCheck,
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InviteAcceptancePage({ params }: InvitePageProps) {
  const { token } = await params;
  const inviteResult = await staffService.getStaffInviteByToken(token);
  const currentUser = await getCurrentUser();

  const renderContent = () => {
    // 1. Invalid or Not Found Token
    if (!inviteResult.valid && inviteResult.reason === "NOT_FOUND") {
      return (
        <div className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-950/80 border border-red-700/40 text-red-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-red-200">
              Invalid Invitation Link
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              This staff invitation token could not be found or has been revoked. Please verify the URL or contact the temple sanctum administrator.
            </p>
          </div>
        </div>
      );
    }

    // 2. Expired Token (> 48 hours)
    if (!inviteResult.valid && inviteResult.reason === "INVITE_EXPIRED") {
      return (
        <div className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-950 border border-amber-600/40 text-amber-400">
            <Clock className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-amber-200">
              Invitation Expired
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Staff invitations are time-limited to <strong>48 hours</strong> for security governance. This invitation has expired. Please ask an active administrator to generate a fresh invitation.
            </p>
          </div>
        </div>
      );
    }

    // 3. Already Used Token
    if (!inviteResult.valid && inviteResult.reason === "INVITE_USED") {
      return (
        <div className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950 border border-emerald-600/40 text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-emerald-200">
              Invitation Already Claimed
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              This single-use invitation has already been accepted and claimed. If you already have administrator credentials, please sign in through the staff portal.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/admin/login"
              className="inline-block w-full text-center bg-stone-700 hover:bg-stone-600 text-stone-100 font-medium py-2.5 rounded-lg text-xs"
            >
              Go to Staff Login
            </Link>
          </div>
        </div>
      );
    }

    const invite = inviteResult.invite!;
    const inviterName = invite.invitedBy?.name || "Temple Administrator";
    const expiresFormatted = new Date(invite.expiresAt).toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 4. Valid Invite - Devotee Not Logged In
    if (!currentUser) {
      return (
        <div className="space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-950 border border-amber-600/30 text-amber-400">
            <MailCheck className="h-7 w-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-serif text-2xl font-bold text-amber-100">
              Staff Administrator Invitation
            </h2>
            <p className="text-xs text-stone-400">
              Invited by <strong>{inviterName}</strong> to join temple administration.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-700/80 text-left text-xs space-y-2">
            <div className="flex justify-between items-center text-stone-400">
              <span>Invited Email:</span>
              <span className="font-mono text-amber-300 font-medium">{invite.email}</span>
            </div>
            <div className="flex justify-between items-center text-stone-400">
              <span>Validity:</span>
              <span className="text-stone-300">Until {expiresFormatted} (48h)</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-700/40 text-[11px] text-amber-200/90 text-left flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Security Rule: You must sign in using the verified identity provider account matching{" "}
              <strong>{invite.email}</strong> to activate staff privileges.
            </span>
          </div>

          <div className="pt-2">
            <Link
              href={`/admin/login?callbackUrl=/invite/${token}`}
              className="flex items-center justify-center gap-2 w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-lg text-xs shadow-md transition-colors"
            >
              <Shield className="h-4 w-4" />
              Sign In to Authenticate & Accept
            </Link>
          </div>
        </div>
      );
    }

    // 5. Valid Invite - User is Logged In
    const isEmailMatching =
      currentUser.email.toLowerCase() === invite.email.toLowerCase();

    if (!isEmailMatching) {
      return (
        <div className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-950 border border-amber-600/30 text-amber-400">
            <AlertTriangle className="h-7 w-7 text-amber-400" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-serif text-2xl font-bold text-amber-100">
              Email Address Mismatch
            </h2>
            <p className="text-xs text-stone-400">
              You are currently signed in as <span className="font-mono text-stone-200">{currentUser.email}</span>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-700/40 text-xs text-red-200 text-left leading-relaxed">
            This invitation was strictly issued to{" "}
            <strong className="font-mono text-white">{invite.email}</strong>. For governance security, invitations can only be accepted by an account with the matching verified email address.
          </div>

          <div className="pt-2">
            <Link
              href={`/admin/login?callbackUrl=/invite/${token}`}
              className="inline-block w-full text-center bg-stone-700 hover:bg-stone-600 text-stone-100 font-medium py-2.5 rounded-lg text-xs"
            >
              Sign In with Matching Email ({invite.email})
            </Link>
          </div>
        </div>
      );
    }

    if (!currentUser.emailVerified) {
      return (
        <div className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-950 border border-amber-600/30 text-amber-400">
            <ShieldAlert className="h-7 w-7 text-amber-400" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-serif text-2xl font-bold text-amber-100">
              Email Verification Required
            </h2>
            <p className="text-xs text-stone-400">
              Your email <span className="font-mono text-stone-200">{currentUser.email}</span> is not marked as verified.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-700/40 text-xs text-amber-200 text-left leading-relaxed">
            Security Rule: Staff invitations can only be accepted when the identity provider returns a VERIFIED email flag.
          </div>
        </div>
      );
    }

    // Email matches & is verified - Ready to claim!
    return (
      <div className="space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950 border border-emerald-600/40 text-emerald-400">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="font-serif text-2xl font-bold text-emerald-100">
            Ready to Join Staff Administration
          </h2>
          <p className="text-xs text-stone-400">
            Authenticated as <strong className="font-mono text-stone-200">{currentUser.email}</strong> (Verified).
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-700/80 text-left text-xs space-y-2">
          <div className="flex justify-between items-center text-stone-400">
            <span>Role Elevation:</span>
            <span className="font-bold text-amber-400 uppercase">Devotee ➔ ADMIN</span>
          </div>
          <div className="flex justify-between items-center text-stone-400">
            <span>Invited By:</span>
            <span className="text-stone-300">{inviterName}</span>
          </div>
        </div>

        <AcceptInviteButton token={token} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-stone-800 border border-stone-700 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 text-center space-y-6">
          {renderContent()}

          <div className="pt-2 border-t border-stone-700">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Temple Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
