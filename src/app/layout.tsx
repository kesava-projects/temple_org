import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sri Venkateswara Temple | Sanatana Dharma Trust",
    template: "%s | Sri Venkateswara Temple",
  },
  description:
    "Official portal for Sri Venkateswara Temple. Discover upcoming festivals, special pujas, book sevas, and participate in sacred community traditions.",
  keywords: ["Temple", "Puja Booking", "Darshan", "Vedic Rituals", "Sanatana Dharma", "Events"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
