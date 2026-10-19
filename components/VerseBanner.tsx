"use client";

import { Caveat } from "next/font/google";
import { useEffect, useRef } from "react";

const handwriting = Caveat({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

const VERSE = "Whatever you do, do it all for the glory of God.";
const REFERENCE = "1 Corinthians 10:31";
const WORDS = VERSE.split(" ");

/**
 * Full-width verse banner on the home page. The verse is real text; on
 * scroll it is "written in" word by word. Without JavaScript or with
 * reduced motion it is simply shown, so nothing is ever hidden by default.
 */
export function VerseBanner() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
    el.dataset.state = "ready";

    const write = () => {
      // Next frame so the hidden state paints before the transition starts.
      requestAnimationFrame(() => {
        el.dataset.state = "written";
      });
    };

    if (alreadyVisible) {
      write();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          write();
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="dt-verse" aria-label="Our motto">
      <figure className="dt-verse__figure">
        <blockquote className="dt-verse__quote">
          <p className={`dt-verse__text ${handwriting.className}`}>
            {WORDS.map((word, index) => (
              <span key={`${word}-${index}`}>
                <span
                  className="dt-verse__word"
                  style={{ "--i": index } as React.CSSProperties}
                >
                  {word}
                </span>
                {index < WORDS.length - 1 ? " " : null}
              </span>
            ))}
          </p>
        </blockquote>
        <svg
          className="dt-verse__flourish"
          viewBox="0 0 320 24"
          aria-hidden
          focusable="false"
        >
          <path
            d="M4 16 C 60 4, 110 22, 160 12 S 260 4, 316 14"
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <figcaption className="dt-verse__ref">{REFERENCE}</figcaption>
      </figure>
    </section>
  );
}
