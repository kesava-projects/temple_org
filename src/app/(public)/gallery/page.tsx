import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Temple & Darshan Photo Gallery | Sri Venkateswara Temple",
  description:
    "Glances of the sacred sanctum, festival processions, Deepa Harati, and serene temple courtyards at Sri Venkateswara Temple.",
};

export default function GalleryPage() {
  const galleryItems = [
    {
      url: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&q=80&w=1200",
      title: "Main Temple Mandapam & Golden Vimana Gopuram",
      category: "Sanctum & Gopuram",
      description: "Dravidian architectural majesty rising into the sacred skies.",
    },
    {
      url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1200",
      title: "Sacred Deepa Harati Ceremony",
      category: "Deepa Harati",
      description: "Evening illumination with camphor and oil lamps during Sandhya Harati.",
    },
    {
      url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=1200",
      title: "Sanctum Outer Prakaram & Stone Carvings",
      category: "Sanctum & Gopuram",
      description: "Handcrafted stone pillars depicting timeless Vedic legends.",
    },
    {
      url: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80&w=1200",
      title: "Brahmotsavam Grand Procession",
      category: "Festivals & Utsavams",
      description: "Devotees gathering in devotion during the annual chariot festival.",
    },
    {
      url: "https://images.unsplash.com/photo-1621847468516-1ed5d0df56fe?auto=format&fit=crop&q=80&w=1200",
      title: "Mahapurnahuti at the Yagashala",
      category: "Vedic Havan",
      description: "Sacred offerings to Agni Deva invoking universal peace and welfare.",
    },
    {
      url: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=1200",
      title: "Nitya Annadanam Dining Seva",
      category: "Annadanam Seva",
      description: "Daily sanctified Mahaprasadam served with unconditional warmth to pilgrims.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Page Header */}
      <div className="border-b border-amber-900/10 pb-6 space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-full">
          Visual Darshan
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 dark:text-stone-100">
          Temple Darshan & Heritage Gallery
        </h1>
        <p className="text-stone-600 dark:text-stone-400 max-w-2xl text-sm leading-relaxed">
          Glimpses of sacred Vedic rituals, festive processions, golden gopurams, and serene temple courtyards.
        </p>
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryItems.map((item, idx) => (
          <div
            key={idx}
            className="group overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="relative h-64 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <Badge className="bg-amber-800/90 text-white text-[10px] font-bold">
                  {item.category}
                </Badge>
              </div>
            </div>

            <div className="p-5 space-y-1.5">
              <h2 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                {item.title}
              </h2>
              <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
