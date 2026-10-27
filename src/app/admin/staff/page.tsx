import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { UserPlus, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

export default async function AdminStaffPage() {
  await requireAdmin();

  const [staffMembers, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.staffInvite.findMany({
      where: { usedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-amber-900/10 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
            Temple Staff & Trust Administration
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage admin users, send secure 48h invitations, and control active status flags.
          </p>
        </div>
        <Button size="sm" className="bg-amber-700 hover:bg-amber-800 text-white text-xs">
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          Invite New Staff Member
        </Button>
      </div>

      {/* Rules Banner */}
      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/60 text-xs text-stone-700 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-900">
          <ShieldAlert className="h-4 w-4 text-amber-700" />
          <span>Staff Security Governance</span>
        </div>
        <p className="text-stone-600 leading-relaxed">
          Admin invites are single-use, time-limited to 48 hours, and require a verified matching OAuth email. The last remaining admin cannot be demoted or deactivated. Deactivating an admin revokes active sessions immediately.
        </p>
      </div>

      {/* Active Staff Table */}
      <div className="space-y-3">
        <h2 className="font-serif font-bold text-base text-stone-900">
          Active Administrative Staff ({staffMembers.length})
        </h2>
        <div className="rounded-xl border border-amber-900/10 bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50/50 border-b border-amber-900/10 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
                <th className="p-4">2FA / TOTP</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {staffMembers.map((staff) => (
                <tr key={staff.id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="p-4 font-semibold text-stone-900">
                    {staff.name}
                  </td>
                  <td className="p-4 font-mono text-stone-600">
                    {staff.email}
                  </td>
                  <td className="p-4">
                    {staff.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        <CheckCircle2 className="h-3 w-3" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">
                        <XCircle className="h-3 w-3" />
                        DEACTIVATED
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-stone-500">
                    {staff.mfaEnabled || staff.twoFactorEnabled ? (
                      <span className="text-emerald-700 font-medium">Enforced</span>
                    ) : (
                      <span className="text-amber-700 font-medium">Pending Setup</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={staffMembers.length <= 1 && staff.isActive}
                      className="h-7 text-[11px]"
                    >
                      {staff.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      <div className="space-y-3">
        <h2 className="font-serif font-bold text-base text-stone-900">
          Pending Staff Invitations ({pendingInvites.length})
        </h2>
        <div className="rounded-xl border border-amber-900/10 bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50/50 border-b border-amber-900/10 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Invited Email</th>
                <th className="p-4">Expires At</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pendingInvites.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-stone-400">
                    No pending invitations.
                  </td>
                </tr>
              ) : (
                pendingInvites.map((inv) => (
                  <tr key={inv.id}>
                    <td className="p-4 font-mono text-stone-800">{inv.email}</td>
                    <td className="p-4 text-stone-500">
                      {new Date(inv.expiresAt).toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        PENDING ACCEPTANCE
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
