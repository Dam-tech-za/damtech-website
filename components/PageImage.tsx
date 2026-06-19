import Image from "next/image";

type PageImageProps = {
  src: string;
  alt: string;
  caption?: string;
  priority?: boolean;
  className?: string;
};

export function PageImage({
  src,
  alt,
  caption,
  priority = false,
  className = "",
}: PageImageProps) {
  return (
    <figure className={`overflow-hidden rounded-2xl border border-slate-200 ${className}`}>
      <div className="relative aspect-[16/10] bg-slate-100">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 720px"
        />
      </div>
      {caption ? (
        <figcaption className="px-4 py-2 text-xs text-slate-500">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
