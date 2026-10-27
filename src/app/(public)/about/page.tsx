export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          Sacred History & Lineage
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-stone-900">
          About Sri Venkateswara Temple
        </h1>
        <p className="text-stone-600 max-w-xl mx-auto text-sm leading-relaxed">
          Dedicated to the glory of the Supreme Lord, upholding authentic Agama rituals, Sanskrit learning, and humanitarian seva.
        </p>
      </div>

      <div className="prose prose-stone max-w-none space-y-6 text-stone-700 leading-relaxed text-sm">
        <section className="bg-white p-8 rounded-2xl border border-amber-900/10 shadow-xs space-y-3">
          <h2 className="font-serif text-xl font-bold text-stone-900">Our Spiritual Mission</h2>
          <p>
            The Sri Venkateswara Temple Trust was founded to provide a sanctuary where devotees from all walks of life can seek peace, participate in ancient Vedic pujas, and nurture spiritual values. The temple follows traditional Vaikhanasa Agama principles meticulously passed down across centuries.
          </p>
        </section>

        <section className="bg-white p-8 rounded-2xl border border-amber-900/10 shadow-xs space-y-3">
          <h2 className="font-serif text-xl font-bold text-stone-900">Community Seva (Annadanam)</h2>
          <p>
            In alignment with the immortal teaching <em>&quot;Atithi Devo Bhava&quot;</em>, our temple serves free sacred Mahaprasadam daily to hundreds of visiting pilgrims and the local community through our uninterrupted Annadanam initiative.
          </p>
        </section>
      </div>
    </div>
  );
}
