export interface ContactFormValues {
  name: string;
  email?: string;
  company?: string;
  projectType?: string;
  budget?: string;
  details: string;
}

export interface PrefillLabels {
  name: string;
  email: string;
  company: string;
  projectType: string;
  budget: string;
  detailsHeading: string;
  truncatedMarker: string;
}

export interface DeeplinkResult {
  url: string;
  truncated: boolean;
}

export const TELEGRAM_URL_LIMIT = 3500;

export function buildTelegramDeeplink(
  values: ContactFormValues,
  labels: PrefillLabels,
  username: string,
  urlLimit: number = TELEGRAM_URL_LIMIT,
): DeeplinkResult {
  const header = buildHeader(values, labels);
  const detailsHeading = `${labels.detailsHeading}:\n`;
  const baseUrl = `https://t.me/${encodeURIComponent(username)}?text=`;

  const fullText = header + detailsHeading + values.details;
  const fullUrl = baseUrl + encodeURIComponent(fullText);

  if (fullUrl.length <= urlLimit) {
    return { url: fullUrl, truncated: false };
  }

  const trailing = "\n" + labels.truncatedMarker;
  const fixedEncodedLength =
    baseUrl.length +
    encodeURIComponent(header + detailsHeading).length +
    encodeURIComponent(trailing).length;
  const allowance = Math.max(0, urlLimit - fixedEncodedLength);
  const truncatedDetails = truncateToEncodedLimit(values.details, allowance);
  const finalText = header + detailsHeading + truncatedDetails + trailing;
  return {
    url: baseUrl + encodeURIComponent(finalText),
    truncated: true,
  };
}

function buildHeader(values: ContactFormValues, labels: PrefillLabels): string {
  const lines: string[] = [`${labels.name}: ${values.name}`];
  if (values.email) lines.push(`${labels.email}: ${values.email}`);
  if (values.company) lines.push(`${labels.company}: ${values.company}`);
  if (values.projectType) lines.push(`${labels.projectType}: ${values.projectType}`);
  if (values.budget) lines.push(`${labels.budget}: ${values.budget}`);
  return lines.join("\n") + "\n\n";
}

function truncateToEncodedLimit(text: string, encodedLimit: number): string {
  if (encodedLimit <= 0) return "";
  if (encodeURIComponent(text).length <= encodedLimit) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (encodeURIComponent(text.slice(0, mid)).length <= encodedLimit) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return text.slice(0, lo);
}
