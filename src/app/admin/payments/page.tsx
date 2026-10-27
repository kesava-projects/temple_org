import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminPaymentsPage() {
  await requireAdmin();

  const payments = await prisma.payment.findMany({
    include: {
      booking: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-amber-900/10 pb-4">
        <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
          Payment Transactions & Gateway Audits
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Razorpay order IDs, payment signatures, and settlement verification logs.
        </p>
      </div>

      <div className="rounded-xl border border-amber-900/10 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/50 border-b border-amber-900/10 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4">Razorpay Order ID</th>
              <th className="p-4">Payment ID</th>
              <th className="p-4">Booking Ref</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-stone-400">
                  No payment transactions logged yet.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="p-4 font-mono font-medium text-stone-900">
                    {p.razorpayOrderId}
                  </td>
                  <td className="p-4 font-mono text-stone-500">
                    {p.razorpayPaymentId ?? "—"}
                  </td>
                  <td className="p-4 font-mono text-amber-900">
                    #{p.bookingId.slice(-8).toUpperCase()}
                  </td>
                  <td className="p-4 font-mono font-semibold text-amber-800">
                    ₹{(p.booking.amountInPaise / 100).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === "SUCCESS"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-stone-400 text-[11px]">
                    {new Date(p.createdAt).toLocaleString("en-IN")}
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
