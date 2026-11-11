"use client";

import { useEffect, type RefObject } from "react";

/**
 * Marks a scrolling panel body with data-more-above / data-more-below while
 * there is hidden content in that direction, so CSS can fade that edge
 * instead of showing a scrollbar.
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const update = () => {
      const above = el.scrollTop > 2;
      const below = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
      el.toggleAttribute("data-more-above", above);
      el.toggleAttribute("data-more-below", below);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    for (const child of Array.from(el.children)) resize.observe(child);
    const mutation = new MutationObserver(update);
    mutation.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [ref, active]);
}
