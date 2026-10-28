import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Sri Venkateswara Temple",
  description:
    "Terms of service, devotee code of conduct, and online seva booking conditions at Sri Venkateswara Temple.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-6">
      <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 border-b border-amber-900/10 pb-4">
        Terms of Service & Code of Conduct
      </h1>
      <div className="prose prose-stone dark:prose-invert text-sm text-stone-700 dark:text-stone-300 space-y-4 leading-relaxed">
        <p>
          By booking sevas, pujas, or offering donations through this portal, you agree to comply with the spiritual rules, traditional code of conduct, and terms established by Sri Venkateswara Temple Trust.
        </p>
        <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">1. Sanctum Protocols & Dress Code</h2>
        <p>
          Devotees attending in-person rituals must adhere strictly to traditional temple attire. The temple management reserves the right to deny sanctum entry if decorum is compromised.
        </p>
        <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">2. Seva Bookings & Rescheduling</h2>
        <p>
          Seat reservations made online are valid for the specific muhurtham slot chosen. In case of unexpected temple festival schedule changes, devotees will be notified via SMS and email.
        </p>
        <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">3. Non-Commercial Devotional Use</h2>
        <p>
          All services and prasadam receipts are non-transferable and non-commercial.
        </p>
      </div>
    </div>
  );
}
