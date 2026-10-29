/**
 * Country marker for a phone number. Windows doesn't draw flag emoji (it shows
 * the letters "ZA"), so South Africa is a small inline SVG flag; other
 * countries show their two-letter code until a flag is added for them.
 */
export function CountryFlag({ country }: { country: string | null | undefined }) {
  if (!country) return null;
  if (country === "ZA") {
    return (
      <svg className="ops-flag" viewBox="0 0 90 60" role="img" aria-label="South Africa">
        <rect width="90" height="60" fill="#002395" />
        <rect width="90" height="30" fill="#de3831" />
        <path d="M0 0 L45 30 L0 60 M45 30 H90" stroke="#fff" strokeWidth="20" fill="none" />
        <path d="M0 0 L45 30 L0 60 M45 30 H90" stroke="#007a4d" strokeWidth="12" fill="none" />
        <path d="M0 9 L31 30 L0 51 Z" fill="#ffb612" />
        <path d="M0 15 L23 30 L0 45 Z" fill="#000" />
      </svg>
    );
  }
  return (
    <span className="ops-flag ops-flag--code" aria-label={country}>
      {country}
    </span>
  );
}
