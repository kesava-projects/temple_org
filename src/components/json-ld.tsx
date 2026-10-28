export function TempleOrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HinduTemple",
    name: "Sri Venkateswara Temple",
    alternateName: "Sri Venkateswara Temple Trust",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://temple.org",
    logo: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&q=80&w=800",
    image: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&q=80&w=1200",
    description:
      "Authentic Vedic temple dedicated to Lord Sri Venkateswara Swami, offering daily pujas, festivals, and community Annadanam.",
    telephone: "+91-80-2345-6789",
    email: "info@temple.org",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Temple Road, Sacred Hills, Tirupati Marg",
      addressLocality: "Tirupati",
      addressRegion: "Andhra Pradesh",
      postalCode: "517501",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "13.6833",
      longitude: "79.3500",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "05:30",
        closes: "12:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "16:30",
        closes: "21:00",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export interface EventJsonLdProps {
  name: string;
  description: string;
  slug: string;
  image?: string;
  startDate: string;
  endDate: string;
  priceInPaise?: number;
  venue: string;
}

export function EventJsonLd({
  name,
  description,
  slug,
  image,
  startDate,
  endDate,
  priceInPaise = 0,
  venue,
}: EventJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://temple.org";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    description,
    image: image ? [image] : undefined,
    url: `${siteUrl}/events/${slug}`,
    startDate,
    endDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Temple Road, Sacred Hills",
        addressLocality: "Tirupati",
        postalCode: "517501",
        addressCountry: "IN",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Sri Venkateswara Temple Trust",
      url: siteUrl,
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/events/${slug}`,
      price: (priceInPaise / 100).toFixed(2),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
