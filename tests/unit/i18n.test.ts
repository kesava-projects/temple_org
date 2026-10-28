import { describe, it, expect } from "vitest";
import { getDictionary, LOCALES, DEFAULT_LOCALE, dictionaries } from "@/lib/i18n/config";

describe("i18n Localization System", () => {
  it("should have English as default locale and support Telugu", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(LOCALES).toContain("en");
    expect(LOCALES).toContain("te");
  });

  it("should return English dictionary when locale is 'en'", () => {
    const dict = getDictionary("en");
    expect(dict.nav.home).toBe("Home");
    expect(dict.hero.title).toBe("Sri Venkateswara Temple");
    expect(dict.darshan.suprabhatam).toContain("Suprabhata Seva");
  });

  it("should return Telugu dictionary when locale is 'te'", () => {
    const dict = getDictionary("te");
    expect(dict.nav.home).toBe("ముఖ్యాంశం");
    expect(dict.hero.title).toContain("శ్రీ వేంకటేశ్వర స్వామి");
    expect(dict.darshan.suprabhatam).toContain("సుప్రభాత సేవ");
  });

  it("should fallback gracefully to English for unknown locales", () => {
    const dict = getDictionary("fr");
    expect(dict.nav.home).toBe("Home");
  });

  it("should ensure dictionary structures are identical across languages", () => {
    const enKeys = Object.keys(dictionaries.en);
    const teKeys = Object.keys(dictionaries.te);

    expect(enKeys).toEqual(teKeys);

    for (const section of enKeys as Array<keyof typeof dictionaries.en>) {
      const enSubKeys = Object.keys(dictionaries.en[section]).sort();
      const teSubKeys = Object.keys(dictionaries.te[section]).sort();
      expect(enSubKeys).toEqual(teSubKeys);
    }
  });
});
