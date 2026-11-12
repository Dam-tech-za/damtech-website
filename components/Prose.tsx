import Image from "next/image";
import { rewriteBlogHtml } from "@/lib/posts";

type ProseProps = {
  html: string;
};

type ParsedBlock =
  | { type: "html"; content: string }
  | {
      type: "image";
      src: string;
      alt: string;
      width?: number;
      height?: number;
      /** Inner HTML of a <figcaption> that sat with the image in the post. */
      caption?: string;
      /** Class of the post's own <figure>, e.g. "base-diagram" for drawn diagrams. */
      figureClass?: string;
    };

// A whole <figure> holding one image and a caption, or a bare <img>.
const FIGURE_OR_IMG =
  /<figure\b([^>]*)>\s*(<img\b[^>]*>)\s*<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>\s*<\/figure>|<img\b[^>]*>/gi;

function parseProseHtml(html: string): ParsedBlock[] {
  // Unwrap images that sit alone inside <p> or <figure>. Splitting the HTML at an
  // image that is still wrapped leaves unbalanced fragments (e.g. "<p>" … "</p>"),
  // which the browser repairs differently from the server markup and breaks hydration.
  const normalized = rewriteBlogHtml(html).replace(
    /<(p|figure)\b[^>]*>\s*(<img\b[^>]*>)\s*<\/\1>/gi,
    "$2",
  );
  const blocks: ParsedBlock[] = [];
  const imgPattern = new RegExp(FIGURE_OR_IMG.source, "gi");
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = imgPattern.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: "html",
        content: normalized.slice(lastIndex, match.index),
      });
    }

    const tag = match[2] ?? match[0];
    const caption = match[3]?.trim();
    const figureClass = match[1]?.match(/\bclass="([\w\s-]+)"/i)?.[1];
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
        ...(caption ? { caption } : {}),
        ...(figureClass ? { figureClass } : {}),
      });
    } else {
      blocks.push({ type: "html", content: match[0] });
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

        if (block.figureClass === "base-diagram" && block.width && block.height) {
          // Drawn diagram: show the whole drawing at its own size, with its caption.
          return (
            <figure key={`img-${index}`} className="base-diagram">
              <Image
                src={block.src}
                alt={block.alt}
                width={block.width}
                height={block.height}
                loading="lazy"
                className="base-diagram__img"
                sizes="(max-width: 600px) 100vw, 544px"
              />
              {block.caption ? (
                <figcaption
                  className="base-diagram__caption"
                  dangerouslySetInnerHTML={{ __html: block.caption }}
                />
              ) : null}
            </figure>
          );
        }

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
            {block.caption ? (
              <figcaption dangerouslySetInnerHTML={{ __html: block.caption }} />
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}
