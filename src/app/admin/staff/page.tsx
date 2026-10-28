import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/lib/prisma";
import { ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { InviteStaffDialog } from "@/components/admin/invite-staff-dialog";
import { StaffActionButton } from "@/components/admin/staff-action-button";

export default async function AdminStaffPage() {
  const currentAdmin = await requireAdmin();

  const [staffMembers, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    }),
    prisma.staffInvite.findMany({
      where: { usedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeAdmins = staffMembers.filter((s) => s.isActive);
  const isSoleActiveAdmin = activeAdmins.length <= 1;

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
        <InviteStaffDialog />
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
          Administrative Staff ({staffMembers.length})
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
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                        {staff.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <span>{staff.name}</span>
                        {staff.id === currentAdmin.id && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-600 text-[10px] font-normal">
                            You
                          </span>
                        )}
                      </div>
                    </div>
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
                    <StaffActionButton
                      staffId={staff.id}
                      staffName={staff.name}
                      staffEmail={staff.email}
                      isActive={staff.isActive}
                      isSoleAdmin={isSoleActiveAdmin && staff.isActive}
                      currentUserIsTarget={staff.id === currentAdmin.id}
                    />
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
                    No pending invitations. All invitations have been claimed or expired.
                  </td>
                </tr>
              ) : (
                pendingInvites.map((inv) => {
                  const isExpired = new Date(inv.expiresAt) < new Date();
                  return (
                    <tr key={inv.id}>
                      <td className="p-4 font-mono text-stone-800">{inv.email}</td>
                      <td className="p-4 text-stone-500">
                        {new Date(inv.expiresAt).toLocaleString("en-IN")}
                      </td>
                      <td className="p-4 text-right">
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            PENDING ACCEPTANCE (48H)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
