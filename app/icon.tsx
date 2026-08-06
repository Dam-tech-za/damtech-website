import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/**
 * App icon (PNG). Exact Damtech water-drop mark on navy — used by browsers that
 * resolve /icon. Apple touch + favicon.ico are static files under public/.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#031926",
        }}
      >
        <svg
          width="512"
          height="512"
          viewBox="0 0 170 170"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="170" height="170" fill="#031926" />
          <path
            fill="#C4CBD4"
            d="M46 20 C29 34 27 52 29 68 C32 78 46 82 46 82 C46 82 60 78 63 68 C65 52 63 34 46 20 Z"
          />
          <path
            fill="#C4CBD4"
            d="M122 14 C98 32 94 58 96 80 C99 96 122 102 122 102 C122 102 145 96 148 80 C150 58 146 32 122 14 Z"
          />
          <path
            fill="#026BC6"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinejoin="round"
            paintOrder="stroke fill"
            d="M85 20 C62 38 55 65 57 88 C60 104 85 112 85 112 C85 112 110 104 113 88 C115 65 108 38 85 20 Z"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
