import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Sri Venkateswara Temple | Sacred History & Lineage",
  description:
    "Learn about the history, spiritual mission, Agama traditions, and daily Annadanam initiative of Sri Venkateswara Temple Trust.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-full">
          Sacred History & Agama Lineage
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 dark:text-stone-100">
          About Sri Venkateswara Temple
        </h1>
        <p className="text-stone-600 dark:text-stone-400 max-w-xl mx-auto text-sm leading-relaxed">
          Dedicated to the glory of the Supreme Lord, upholding authentic Agama rituals, Sanskrit learning, and humanitarian seva.
        </p>
      </div>

      <div className="prose prose-stone max-w-none space-y-6 text-stone-700 dark:text-stone-300 leading-relaxed text-sm">
        <section className="bg-white dark:bg-stone-900 p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">Our Spiritual Mission</h2>
          <p>
            The Sri Venkateswara Temple Trust was founded to provide a sanctuary where devotees from all walks of life can seek peace, participate in ancient Vedic pujas, and nurture spiritual values. The temple follows traditional Vaikhanasa Agama principles meticulously passed down across centuries.
          </p>
        </section>

        <section className="bg-white dark:bg-stone-900 p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">Daily Community Annadanam</h2>
          <p>
            In alignment with the immortal teaching <em>&quot;Atithi Devo Bhava&quot;</em>, our temple serves free sacred Mahaprasadam daily to hundreds of visiting pilgrims and the local community through our uninterrupted Annadanam initiative.
          </p>
        </section>

        <section className="bg-white dark:bg-stone-900 p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">Agama Puja & Priest Lineage</h2>
          <p>
            Our dedicated team of hereditary Veda Panditas conduct daily Suprabhata Seva, Sahasranama Archana, Nitya Kalyanotsavam, and Maha Deepa Harati with purity and devotion according to classical scriptures.
          </p>
        </section>
      </div>
    </div>
  );
}
