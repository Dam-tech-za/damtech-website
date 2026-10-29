/**
 * Compact phone display for the operations board. South African numbers get a
 * flag and +27 grouping; anything else is shown as typed.
 */

export type PhoneDisplay = {
  flag: string;
  /** ISO country from the calling code (e.g. "ZA"), for the flag. */
  country: string | null;
  text: string;
  href: string;
};

/** Calling codes for the countries Damtech customers are likely to have. Longest first. */
const CALLING_CODES: [string, string][] = [
  ["264", "NA"], ["267", "BW"], ["263", "ZW"], ["258", "MZ"], ["266", "LS"], ["268", "SZ"], ["260", "ZM"],
  ["353", "IE"], ["27", "ZA"], ["44", "GB"], ["61", "AU"], ["64", "NZ"], ["49", "DE"], ["31", "NL"], ["1", "US"],
];

function countryFromInternational(num: string): string | null {
  return CALLING_CODES.find(([code]) => num.startsWith(code))?.[1] ?? null;
}

const ZA_FLAG = "🇿🇦";

function digits(raw: string): string {
  return raw.replace(/\D/g, "");
}

function groupZaNational(nine: string): string {
  if (nine.length !== 9) return nine;
  return `${nine.slice(0, 2)} ${nine.slice(2, 5)} ${nine.slice(5)}`;
}

export function displayPhone(raw: string | null | undefined): PhoneDisplay | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const num = digits(trimmed);
  if (!num) return { flag: "", country: null, text: trimmed, href: `tel:${trimmed.replace(/\s+/g, "")}` };

  let national = num;
  if (num.startsWith("27") && num.length >= 11) national = num.slice(2);
  else if (num.startsWith("0") && num.length >= 10) national = num.slice(1);

  const looksZa =
    (num.startsWith("27") && num.length >= 11 && num.length <= 12) ||
    (num.startsWith("0") && num.length >= 10 && num.length <= 11) ||
    (national.length === 9 && /^[1-8]/.test(national));

  if (looksZa && national.length >= 9) {
    const nine = national.slice(0, 9);
    const text = `+27 ${groupZaNational(nine)}`;
    return { flag: ZA_FLAG, country: "ZA", text, href: `tel:+27${nine}` };
  }

  const href = trimmed.startsWith("+") ? `tel:${num.length ? `+${num}` : trimmed}` : `tel:${trimmed.replace(/\s+/g, "")}`;
  const text = trimmed.startsWith("+") ? `+${num}` : trimmed;
  const international = trimmed.startsWith("+") || trimmed.startsWith("00");
  return { flag: "", country: international ? countryFromInternational(num.replace(/^00/, "")) : null, text, href };
}

/** "+27749217449" → { code: "+27", national: "74 921 7449" }; national ZA numbers default to +27. */
export function splitPhone(raw: string | null | undefined): { code: string; national: string } {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { code: "+27", national: "" };
  const num = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
    const intl = num.replace(/^00/, "");
    const hit = CALLING_CODES.find(([code]) => intl.startsWith(code));
    if (hit) {
      const rest = intl.slice(hit[0].length);
      return { code: `+${hit[0]}`, national: hit[0] === "27" && rest.length === 9 ? `${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}` : rest };
    }
    return { code: "+", national: intl };
  }
  const national = num.startsWith("0") ? num.slice(1) : num;
  return { code: "+27", national: national.length === 9 ? `${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}` : national };
}
