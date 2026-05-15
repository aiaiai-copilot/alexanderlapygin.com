import { ru } from "./ru";
import { en } from "./en";
import { DEFAULT_LOCALE, LOCALES, type Dictionary, type Locale } from "./types";

export const dictionaries: Record<Locale, Dictionary> = { ru, en };

export { LOCALES, DEFAULT_LOCALE };
export type { Locale, Dictionary };

export function localeFromUrl(url: URL): Locale {
  const first = url.pathname.split("/").filter(Boolean)[0];
  return first === "en" ? "en" : "ru";
}

export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function localizedPath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === "ru") {
    return clean === "/" ? "/" : clean;
  }
  if (clean === "/") return "/en";
  return `/en${clean}`;
}

export function alternateLocale(locale: Locale): Locale {
  return locale === "ru" ? "en" : "ru";
}

export function bcp47(locale: Locale): string {
  return locale === "ru" ? "ru" : "en";
}

export function ogLocale(locale: Locale): string {
  return locale === "ru" ? "ru_RU" : "en_US";
}

/**
 * Compute the URL of the same page in the alternate locale.
 * Returns null if the equivalent path can't be derived (used for static pages only here).
 */
export function alternatePath(locale: Locale, currentPath: string): string {
  const alt = alternateLocale(locale);
  let bare: string;
  if (locale === "en") {
    bare = currentPath.replace(/^\/en(\/|$)/, "/");
    if (bare === "" ) bare = "/";
  } else {
    bare = currentPath;
  }
  if (bare !== "/" && bare.endsWith("/")) bare = bare.slice(0, -1);
  return localizedPath(alt, bare);
}
