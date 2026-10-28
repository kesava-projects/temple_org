import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Car,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contact & Temple Directions | Sri Venkateswara Temple",
  description:
    "Contact Sri Venkateswara Temple office, priest services helpline, mandir darshan hours, temple directions, and pilgrim inquiries.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="border-b border-amber-900/10 pb-6 space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-full">
          Devotee Helpdesk & Temple Office
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 dark:text-stone-100">
          Contact Us & Visit Guidelines
        </h1>
        <p className="text-stone-600 dark:text-stone-400 max-w-2xl text-sm leading-relaxed">
          We welcome pilgrims and devotees to experience peace and divine blessings. Contact our administrative office for special seva queries, sankalpam bookings, or directions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Info & Timings Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Temple Office */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-700" />
              Sacred Sanctum Address
            </h2>
            <div className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 space-y-1">
              <p className="font-semibold text-stone-800 dark:text-stone-200">
                Sri Venkateswara Temple Trust
              </p>
              <p>Temple Road, Sacred Hills, Tirupati Marg</p>
              <p>Tirupati, Andhra Pradesh, PIN 517501, India</p>
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <Phone className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Office: +91 80 2345 6789 (9:00 AM – 6:00 PM)</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <Phone className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Priest Seva Desk: +91 80 2345 6790</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <Mail className="h-4 w-4 text-amber-600 shrink-0" />
                <span>info@temple.org / seva@temple.org</span>
              </div>
            </div>
          </div>

          {/* Mandir Darshan Hours */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-3">
            <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-700" />
              Mandir Gate & Darshan Hours
            </h3>
            <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
                <span>Morning Suprabhatam & Darshan:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  05:30 AM – 12:30 PM
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
                <span>Sanctum Rest (Gates Closed):</span>
                <span className="text-stone-500">12:30 PM – 04:00 PM</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Evening Darshan & Harati:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  04:30 PM – 09:00 PM
                </span>
              </div>
            </div>
          </div>

          {/* Parking & Accessibility */}
          <div className="rounded-2xl border border-amber-900/10 bg-amber-50/40 dark:bg-stone-900/50 p-6 space-y-2 text-xs text-stone-600 dark:text-stone-400">
            <h3 className="font-serif text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Car className="h-4 w-4 text-amber-700" />
              Parking & Pilgrim Facilities
            </h3>
            <p>
              Free 4-wheeler and 2-wheeler devotee parking available at Gate 2. Wheelchair access ramps are installed at the Northern Raja Gopuram entrance.
            </p>
          </div>
        </div>

        {/* Devotee Inquiry Form (7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                Send a Message or Seva Inquiry
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Our temple administration desk will respond to your queries within 24 business hours.
              </p>
            </div>

            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
