import Image from "next/image";
import type { ProjectImage } from "@/lib/projects";

type ProjectGalleryProps = {
  images: ProjectImage[];
};

export function ProjectGallery({ images }: ProjectGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {images.map((image) => (
        <figure
          key={image.src}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
        >
          <div className="relative aspect-[16/10]">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 480px"
            />
          </div>
        </figure>
      ))}
    </div>
  );
}
