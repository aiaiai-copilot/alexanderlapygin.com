import type { Locale } from "~/i18n";

const WPM: Record<Locale, number> = { ru: 200, en: 230 };

export function readingTimeMinutes(text: string, locale: Locale): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / WPM[locale]);
  return Math.max(1, minutes);
}
