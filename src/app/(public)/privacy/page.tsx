import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Sri Venkateswara Temple",
  description:
    "Privacy policy and data handling guidelines for devotees booking pujas or donating online at Sri Venkateswara Temple.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-6">
      <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 border-b border-amber-900/10 pb-4">
        Devotee Privacy Policy
      </h1>
      <div className="prose prose-stone dark:prose-invert text-sm text-stone-700 dark:text-stone-300 space-y-4 leading-relaxed">
        <p>
          Sri Venkateswara Temple Trust respects the privacy of all devotees. This Privacy Policy details how we handle personal information gathered through our online booking and donation portal.
        </p>
        <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">Information We Collect</h2>
        <p>
          We collect your name, email address, contact phone number, and puja sankalpam details (such as Gotra and Nakshatra) when you make a booking or register for sevas.
        </p>
        <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">Payment Security & Processing</h2>
        <p>
          All online payments are securely processed through Razorpay using industry-standard TLS encryption. We do not store credit card or debit card numbers on our servers.
        </p>
        <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">Contact Us</h2>
        <p>
          For privacy inquiries, please contact our trust data officers at <code>privacy@temple.org</code>.
        </p>
      </div>
    </div>
  );
}
