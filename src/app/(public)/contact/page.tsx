import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          Get in Touch
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900">
          Contact Temple Trust
        </h1>
        <p className="text-stone-600 text-sm">
          Have queries regarding puja dates, sankalpam bookings, or temple timings? Reach our sevak team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-amber-900/10 space-y-3">
          <div className="flex items-center gap-3 text-amber-800 font-semibold">
            <MapPin className="h-5 w-5 text-amber-600" />
            <span>Temple Address</span>
          </div>
          <p className="text-stone-600 text-sm pl-8 leading-relaxed">
            Sri Venkateswara Temple Trust<br />
            Temple Road, Sacred Hills, PIN: 517507, India
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-amber-900/10 space-y-3">
          <div className="flex items-center gap-3 text-amber-800 font-semibold">
            <Phone className="h-5 w-5 text-amber-600" />
            <span>Phone Support</span>
          </div>
          <p className="text-stone-600 text-sm pl-8 leading-relaxed">
            Helpline: +91 8000 123 456<br />
            Office: +91 8000 123 789 (8 AM – 7 PM)
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-amber-900/10 space-y-3">
          <div className="flex items-center gap-3 text-amber-800 font-semibold">
            <Mail className="h-5 w-5 text-amber-600" />
            <span>Email Queries</span>
          </div>
          <p className="text-stone-600 text-sm pl-8 leading-relaxed">
            Seva inquiries: seva@temple.org<br />
            Trust Administration: trust@temple.org
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-amber-900/10 space-y-3">
          <div className="flex items-center gap-3 text-amber-800 font-semibold">
            <Clock className="h-5 w-5 text-amber-600" />
            <span>Temple Office Hours</span>
          </div>
          <p className="text-stone-600 text-sm pl-8 leading-relaxed">
            Open daily: 8:00 AM – 8:00 PM IST<br />
            (Except during Rajabhoga Harati)
          </p>
        </div>
      </div>
    </div>
  );
}
