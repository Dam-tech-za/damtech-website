/**
 * Compact phone display for the operations board. South African numbers get a
 * flag and +27 grouping; anything else is shown as typed.
 */

export type PhoneDisplay = {
  flag: string;
  text: string;
  href: string;
};

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
  if (!num) return { flag: "", text: trimmed, href: `tel:${trimmed.replace(/\s+/g, "")}` };

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
    return { flag: ZA_FLAG, text, href: `tel:+27${nine}` };
  }

  const href = trimmed.startsWith("+") ? `tel:${num.length ? `+${num}` : trimmed}` : `tel:${trimmed.replace(/\s+/g, "")}`;
  const text = trimmed.startsWith("+") ? `+${num}` : trimmed;
  return { flag: "", text, href };
}
