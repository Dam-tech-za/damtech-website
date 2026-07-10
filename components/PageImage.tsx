import Image, { type StaticImageData } from "next/image";

type PageImageProps = {
  image?: StaticImageData;
  /** Public path fallback when no static import is available. */
  src?: string;
  /** Ignored — present when spreading `SiteImage` from `SITE_IMAGES`. */
  path?: string;
  alt: string;
  caption?: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

function isStaticImage(value: StaticImageData | string): value is StaticImageData {
  return typeof value !== "string";
}

export function PageImage({
  image,
  src,
  alt,
  caption,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 720px",
}: PageImageProps) {
  const resolved = image ?? src;

  if (!resolved) {
    return null;
  }

  const staticImage = isStaticImage(resolved);

  return (
    <figure
      className={`overflow-hidden rounded-2xl border border-slate-200 ${className}`}
    >
      <div className="relative aspect-[16/10] bg-slate-100">
        <Image
          src={resolved}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          placeholder={staticImage ? "blur" : "empty"}
          className="object-cover"
          sizes={sizes}
        />
      </div>
      {caption ? (
        <figcaption className="px-4 py-2 text-xs text-subtle">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
