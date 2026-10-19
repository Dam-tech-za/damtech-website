/** Rules for a new admin password. Pure so it can be unit-tested. */
export const PASSWORD_MIN_LENGTH = 10;
/** Supabase Auth (bcrypt) ignores bytes beyond 72. */
export const PASSWORD_MAX_LENGTH = 72;

export function validateNewPassword(password: string, confirm: string): string | null {
  if (!password) return "Enter a new password.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Use no more than ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Include at least one letter and one number.";
  }
  if (/^(.)\1+$/.test(password)) return "Choose a less predictable password.";
  if (password !== confirm) return "The two passwords do not match.";
  return null;
}

export function normaliseResetEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/**
 * Origin for the emailed reset link. Only known Damtech hosts (and local
 * development) are used; anything else falls back to the canonical site so a
 * forged Origin header cannot point the link elsewhere. Supabase also rejects
 * redirect URLs that are not on its allow list.
 */
export function resetLinkOrigin(originHeader: string | null, canonical: string): string {
  if (!originHeader) return canonical;
  try {
    const url = new URL(originHeader);
    const host = url.hostname.toLowerCase();
    if (url.protocol === "https:" && (host === "www.dam-tech.co.za" || host.endsWith("-damtech.vercel.app"))) {
      return url.origin;
    }
    if (url.protocol === "http:" && (host === "localhost" || host === "127.0.0.1")) {
      return url.origin;
    }
  } catch {
    // fall through
  }
  return canonical;
}
