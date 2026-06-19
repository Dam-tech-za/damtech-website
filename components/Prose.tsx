import Image from "next/image";
import { rewriteBlogHtml } from "@/lib/posts";

type ProseProps = {
  html: string;
};

type ParsedBlock =
  | { type: "html"; content: string }
  | { type: "image"; src: string; alt: string; width?: number; height?: number };

function parseProseHtml(html: string): ParsedBlock[] {
  const normalized = rewriteBlogHtml(html);
  const blocks: ParsedBlock[] = [];
  const imgPattern = /<img\b[^>]*>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = imgPattern.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: "html",
        content: normalized.slice(lastIndex, match.index),
      });
    }

    const tag = match[0];
    const src =
      tag.match(/\bsrc="([^"]+)"/i)?.[1] ??
      tag.match(/\bdata-src="([^"]+)"/i)?.[1] ??
      "";
    const alt = tag.match(/\balt="([^"]*)"/i)?.[1] ?? "";
    const width = Number(tag.match(/\bwidth="(\d+)"/i)?.[1]);
    const height = Number(tag.match(/\bheight="(\d+)"/i)?.[1]);

    if (src.startsWith("/images/")) {
      blocks.push({
        type: "image",
        src,
        alt,
        ...(width > 0 ? { width } : {}),
        ...(height > 0 ? { height } : {}),
      });
    } else {
      blocks.push({ type: "html", content: tag });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < normalized.length) {
    blocks.push({ type: "html", content: normalized.slice(lastIndex) });
  }

  return blocks;
}

export function Prose({ html }: ProseProps) {
  const blocks = parseProseHtml(html);

  return (
    <div className="prose">
      {blocks.map((block, index) => {
        if (block.type === "html") {
          return (
            <div
              key={`html-${index}`}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          );
        }

        const aspect =
          block.width && block.height
            ? block.width / block.height
            : 16 / 9;

        return (
          <figure key={`img-${index}`} className="my-8 overflow-hidden rounded-2xl">
            <div
              className="relative w-full bg-slate-100"
              style={{ aspectRatio: String(aspect) }}
            >
              <Image
                src={block.src}
                alt={block.alt}
                fill
                loading="lazy"
                fetchPriority="low"
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 720px"
              />
            </div>
          </figure>
        );
      })}
    </div>
  );
}
