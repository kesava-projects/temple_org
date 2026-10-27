export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-6">
      <h1 className="font-serif text-3xl font-bold text-stone-900 border-b border-amber-900/10 pb-4">
        Puja Seva Refund Policy
      </h1>
      <div className="prose prose-stone text-sm text-stone-700 space-y-4">
        <p>
          As religious seva contributions are dedicated towards sacred materials and temple maintenance, standard donations are non-refundable.
        </p>
        <h2 className="font-serif text-lg font-bold text-stone-900">Event Cancellation by Temple</h2>
        <p>
          In the rare event that an event or special puja is cancelled or rescheduled due to unforeseen natural or administrative reasons, devotees will be offered a full refund or the option to reschedule to another date.
        </p>
        <h2 className="font-serif text-lg font-bold text-stone-900">Payment Disputes & Double Charges</h2>
        <p>
          If your bank account was debited more than once for a single booking, our automated Razorpay reconciliation will initiate a refund within 5–7 working days back to the original payment source. For assistance, email <code>refunds@temple.org</code> with your booking ID.
        </p>
      </div>
    </div>
  );
}
