export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-6">
      <h1 className="font-serif text-3xl font-bold text-stone-900 border-b border-amber-900/10 pb-4">
        Terms of Service
      </h1>
      <div className="prose prose-stone text-sm text-stone-700 space-y-4">
        <p>
          By booking sevas, pujas, or making charitable offerings on this portal, devotees agree to abide by the temple customs, dress code, and administrative guidelines.
        </p>
        <h2 className="font-serif text-lg font-bold text-stone-900">Temple Decorum & Dress Code</h2>
        <p>
          Traditional attire is respectfully requested inside the sanctum sanctorum during all pujas and abhishekams. Devotees are requested to arrive at least 15 minutes prior to scheduled muhurtham timings.
        </p>
        <h2 className="font-serif text-lg font-bold text-stone-900">Seat & Slot Reservations</h2>
        <p>
          Puja slots are allocated on a first-come-first-served basis. Bookings pending payment hold seats for 15 minutes before being released automatically.
        </p>
      </div>
    </div>
  );
}
