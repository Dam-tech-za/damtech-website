type DamtechLogoProps = {
  /** Rendered width and height in pixels. */
  size?: number;
  className?: string;
};

/** Symmetric teardrop paths — tip up, mirrored left/right curves. */
const DROPLET_BACK_LEFT =
  "M46 20 C29 34 27 52 29 68 C32 78 46 82 46 82 C46 82 60 78 63 68 C65 52 63 34 46 20 Z";

const DROPLET_BACK_RIGHT =
  "M122 14 C98 32 94 58 96 80 C99 96 122 102 122 102 C122 102 145 96 148 80 C150 58 146 32 122 14 Z";

const DROPLET_FRONT =
  "M85 20 C62 38 55 65 57 88 C60 104 85 112 85 112 C85 112 110 104 113 88 C115 65 108 38 85 20 Z";

/** Three-droplet Damtech mark — grey rear drops, blue front drop with white gap. */
export function DamtechLogo({ size = 40, className }: DamtechLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="18 -7 138 138"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden
    >
      <path fill="#C4CBD4" d={DROPLET_BACK_LEFT} />
      <path fill="#C4CBD4" d={DROPLET_BACK_RIGHT} />
      <path
        fill="#0EA5E9"
        stroke="#FFFFFF"
        strokeWidth="7"
        strokeLinejoin="round"
        paintOrder="stroke fill"
        d={DROPLET_FRONT}
      />
    </svg>
  );
}
