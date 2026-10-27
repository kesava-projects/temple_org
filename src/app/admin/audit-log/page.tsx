import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/lib/prisma";
import { ScrollText, Shield } from "lucide-react";

export default async function AdminAuditLogPage() {
  await requireAdmin();

  const auditLogs = await prisma.auditLog.findMany({
    include: {
      user: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-amber-900/10 pb-4">
        <div className="flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-amber-700" />
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
            Immutable Security Audit Log
          </h1>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          Append-only audit trail logging administrative creations, updates, cancellations, refunds, staff invites, and data exports.
        </p>
      </div>

      <div className="rounded-xl border border-amber-900/10 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/50 border-b border-amber-900/10 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Action</th>
              <th className="p-4">Entity</th>
              <th className="p-4">Operator / Admin</th>
              <th className="p-4">IP Address</th>
              <th className="p-4">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-stone-400">
                  No audit log entries recorded.
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-amber-50/20 font-mono text-[11px]">
                  <td className="p-4 text-stone-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="p-4 font-bold text-amber-900 dark:text-amber-300">
                    {log.action}
                  </td>
                  <td className="p-4 text-stone-700 font-medium">
                    {log.entity} {log.entityId ? `(#${log.entityId.slice(-6)})` : ""}
                  </td>
                  <td className="p-4 text-stone-800">
                    {log.user ? (
                      <span className="inline-flex items-center gap-1 font-sans text-xs">
                        <Shield className="h-3 w-3 text-amber-600" />
                        {log.user.email}
                      </span>
                    ) : (
                      <span className="text-stone-400">System / Anonymous</span>
                    )}
                  </td>
                  <td className="p-4 text-stone-500">{log.ip ?? "—"}</td>
                  <td className="p-4 text-stone-600 max-w-xs truncate" title={JSON.stringify(log.meta)}>
                    {log.meta ? JSON.stringify(log.meta) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
