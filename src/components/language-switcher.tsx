"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("temple_locale") as Locale | null;
      if (saved === "en" || saved === "te") {
        return saved;
      }
    }
    return "en";
  });

  const toggleLanguage = () => {
    const nextLocale: Locale = currentLocale === "en" ? "te" : "en";
    setCurrentLocale(nextLocale);
    localStorage.setItem("temple_locale", nextLocale);
    // Set cookie for server components
    document.cookie = `temple_locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-900/20 bg-amber-50/50 hover:bg-amber-100/60 text-amber-900 transition-colors"
      title={currentLocale === "en" ? "Switch to Telugu (తెలుగు)" : "Switch to English"}
    >
      <Languages className="h-3.5 w-3.5 text-amber-700" />
      <span>{currentLocale === "en" ? "EN | తెలుగు" : "తెలుగు | EN"}</span>
    </button>
  );
}
