"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type VideoPlayerProps = {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
};

export function VideoPlayer({
  src,
  poster,
  title,
  className = "",
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${className}`}
    >
      {shouldLoad ? (
        <video
          src={src}
          poster={poster}
          controls
          preload="none"
          playsInline
          title={title}
          className="h-full w-full object-cover"
        >
          <track kind="captions" />
        </video>
      ) : poster ? (
        <Image
          src={poster}
          alt={title ? `${title} video poster` : ""}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 720px"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      )}
    </div>
  );
}
