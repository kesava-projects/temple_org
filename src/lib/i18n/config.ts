import { en, type Dictionary } from "./dictionaries/en";
import { te } from "./dictionaries/te";

export const LOCALES = ["en", "te"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  te,
};

export function getDictionary(locale: string = DEFAULT_LOCALE): Dictionary {
  if (locale in dictionaries) {
    return dictionaries[locale as Locale];
  }
  return dictionaries[DEFAULT_LOCALE];
}
