import { Camera } from "lucide-react";

export default function GalleryPage() {
  const images = [
    {
      url: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&q=80&w=800",
      caption: "Main Temple Mandapam & Gopuram",
    },
    {
      url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800",
      caption: "Sacred Deepa Harati Ceremony",
    },
    {
      url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800",
      caption: "Temple Architecture & Sacred Courtyard",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="border-b border-amber-900/10 pb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          Visual Darshan
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mt-1">
          Temple & Darshan Photo Gallery
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          Glances of the sacred sanctum, festival processions, and serene temple courtyards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="group overflow-hidden rounded-2xl border border-amber-900/10 bg-white shadow-xs"
          >
            <div className="h-64 w-full overflow-hidden bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-4 flex items-center gap-2 text-xs font-medium text-stone-700">
              <Camera className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>{img.caption}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
