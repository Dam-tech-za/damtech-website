import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — same mark as icon.svg, re-rendered as PNG (Apple doesn't accept SVG here). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg
        width="180"
        height="180"
        viewBox="0 0 170 170"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="170" height="170" fill="#020A16" />
        <path
          fill="#C4CBD4"
          d="M46 20 C29 34 27 52 29 68 C32 78 46 82 46 82 C46 82 60 78 63 68 C65 52 63 34 46 20 Z"
        />
        <path
          fill="#C4CBD4"
          d="M122 14 C98 32 94 58 96 80 C99 96 122 102 122 102 C122 102 145 96 148 80 C150 58 146 32 122 14 Z"
        />
        <path
          fill="#0EA5E9"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinejoin="round"
          paintOrder="stroke fill"
          d="M85 20 C62 38 55 65 57 88 C60 104 85 112 85 112 C85 112 110 104 113 88 C115 65 108 38 85 20 Z"
        />
      </svg>
    ),
    { ...size },
  );
}
