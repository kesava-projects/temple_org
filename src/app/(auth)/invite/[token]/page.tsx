import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MailCheck, ArrowLeft, Shield } from "lucide-react";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InviteAcceptancePage({ params }: InvitePageProps) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-stone-800 border border-stone-700 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-950 border border-amber-600/30 text-amber-400">
            <MailCheck className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-amber-100">
              Staff Invitation Received
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              You have been invited to join the temple administrative staff. Admin invites are single-use, time-limited (48h), and require authentication with your verified invite email.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-700 text-xs font-mono text-amber-300/80 truncate">
            Invite Token: {token}
          </div>

          <div className="pt-2">
            <Link href={`/admin/login?invite=${token}`}>
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium">
                <Shield className="mr-2 h-4 w-4" />
                Sign In to Accept Invitation
              </Button>
            </Link>
          </div>

          <div className="pt-2 border-t border-stone-700">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
