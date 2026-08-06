import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/**
 * App icon — serves the static transparent Damtech mark (public/icons/icon-512.png).
 * Avoids ImageResponse/Satori flattening alpha to an opaque background.
 */
export default async function Icon() {
  const body = await readFile(
    join(process.cwd(), "public", "icons", "icon-512.png"),
  );
  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
