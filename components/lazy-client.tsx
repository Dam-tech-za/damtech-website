"use client";

import dynamic from "next/dynamic";

/** Video player — client-only; loads when imported on pages with video embeds. */
export const LazyVideoPlayer = dynamic(
  () => import("@/components/VideoPlayer").then((mod) => mod.VideoPlayer),
  {
    ssr: false,
    loading: () => <p className="text-sm text-subtle">Loading…</p>,
  },
);
