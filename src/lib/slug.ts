/**
 * Entry IDs from the glob loader look like "ru/foo" or "en/foo".
 * The "page slug" is just the part after the locale prefix.
 */
export function pageSlug(entryId: string): string {
  return entryId.replace(/^(ru|en)\//, "");
}
