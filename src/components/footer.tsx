import Link from "next/link";
import { ShieldAlert, MapPin, Clock, Phone, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-amber-900/10 bg-stone-900 text-stone-300">
      {/* Sacred Top Banner */}
      <div className="border-b border-stone-800 bg-gradient-to-r from-amber-950/60 via-stone-900 to-amber-950/60 py-3 text-center text-xs font-serif tracking-widest text-amber-300">
        ॐ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः • LOKAH SAMASTAH SUKHINO BHAVANTU
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Col 1: Temple Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-600 text-white font-serif font-bold text-lg">
                ॐ
              </div>
              <span className="font-serif text-lg font-bold text-amber-100">
                Sri Venkateswara Temple
              </span>
            </div>
            <p className="text-sm leading-relaxed text-stone-400">
              A serene sacred haven dedicated to preserving traditional Vedic worship, spiritual solace, and benevolent community seva.
            </p>
            <div className="pt-1 text-xs text-amber-400/80">
              Registered Religious & Charitable Trust.
            </div>
          </div>

          {/* Col 2: Darshan Timings & Seva */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold tracking-wider uppercase text-amber-300">
              Darshan & Timings
            </h4>
            <div className="space-y-2 text-sm text-stone-400">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-stone-200">Morning Session</div>
                  <div>6:00 AM – 12:30 PM</div>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-stone-200">Evening Session</div>
                  <div>4:30 PM – 9:00 PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Contact & Address */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold tracking-wider uppercase text-amber-300">
              Sanctum Contact
            </h4>
            <div className="space-y-2.5 text-sm text-stone-400">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Temple Road, Sacred Hills, PIN: 517507, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                <span>+91 8000 123 456</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                <span>seva@temple.org</span>
              </div>
            </div>
          </div>

          {/* Col 4: Quick Links & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold tracking-wider uppercase text-amber-300">
              Devotee Care & Trust
            </h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/events" className="hover:text-amber-300 transition-colors">
                  Upcoming Festivals & Pujas
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-amber-300 transition-colors">
                  Darshan & Mandapam Gallery
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-amber-300 transition-colors">
                  Our Lineage & History
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-amber-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-300 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-amber-300 transition-colors">
                  Puja Seva Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-stone-800 pt-6 text-xs text-stone-500 sm:flex-row">
          <p>© {currentYear} Sri Venkateswara Temple Organization. All sacred rights reserved.</p>
          <div className="mt-3 flex items-center gap-4 sm:mt-0">
            <Link
              href="/admin/login"
              className="flex items-center gap-1 text-stone-500 hover:text-amber-400 transition-colors"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              Staff Administration Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
