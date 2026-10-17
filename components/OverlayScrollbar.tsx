"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A slim, rounded overlay scroll indicator for the whole page.
 *
 * The native scrollbar is hidden in globals.css so the content keeps its full
 * width and never shifts when a scrollbar appears (classic Windows scrollbars
 * reserve layout space). This draws a light-grey pill on the right that reflects
 * scroll position, can be dragged to scroll, and fades out when the page is idle
 * or is not scrollable. It is purely an enhancement — keyboard, wheel and touch
 * scrolling of the document are untouched.
 *
 * Mounted once in the public page chrome; it does not render on touch-primary
 * devices (which already have no persistent, space-reserving scrollbar).
 */
export function OverlayScrollbar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLButtonElement>(null);
  const hideTimer = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const drag = useRef<{ startY: number; startScroll: number } | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);

  // Only show where a pointer is fine (desktop); touch devices overlay natively.
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const apply = () => setEnabled(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const scrollEl = () => document.scrollingElement || document.documentElement;

  const layout = useCallback(() => {
    frame.current = null;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    const el = scrollEl();
    const viewport = el.clientHeight;
    const content = el.scrollHeight;
    const overflow = content - viewport;

    // Nothing to scroll (or a rounding-level amount): hide and bail.
    if (overflow <= 4) {
      thumb.style.height = "0px";
      setVisible(false);
      return;
    }

    const trackH = track.clientHeight;
    const minThumb = 32;
    const thumbH = Math.max(minThumb, (viewport / content) * trackH);
    const maxTop = trackH - thumbH;
    const top = maxTop * (el.scrollTop / overflow);

    thumb.style.height = `${thumbH}px`;
    thumb.style.transform = `translateY(${Math.max(0, Math.min(maxTop, top))}px)`;
  }, []);

  const requestLayout = useCallback(() => {
    if (frame.current == null) frame.current = requestAnimationFrame(layout);
  }, [layout]);

  const reveal = useCallback(() => {
    setVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    // Keep it up while dragging; otherwise fade after a short idle.
    hideTimer.current = window.setTimeout(() => {
      if (!drag.current) setVisible(false);
    }, 1400);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onScroll = () => {
      requestLayout();
      reveal();
    };
    const onResize = () => requestLayout();

    // Defer the first measure/reveal out of the effect body (avoids a
    // synchronous state update during mount).
    const initial = requestAnimationFrame(() => {
      requestLayout();
      reveal();
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(() => requestLayout());
    ro.observe(document.body);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      cancelAnimationFrame(initial);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, [enabled, requestLayout, reveal]);

  const onThumbPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const el = scrollEl();
      drag.current = { startY: event.clientY, startScroll: el.scrollTop };
      setActive(true);
      setVisible(true);
      thumbRef.current?.setPointerCapture(event.pointerId);

      const track = trackRef.current;
      const thumb = thumbRef.current;

      const onMove = (e: PointerEvent) => {
        if (!drag.current || !track || !thumb) return;
        const viewport = el.clientHeight;
        const content = el.scrollHeight;
        const overflow = content - viewport;
        const trackH = track.clientHeight;
        const thumbH = thumb.offsetHeight;
        const maxTop = trackH - thumbH;
        if (maxTop <= 0) return;
        const deltaY = e.clientY - drag.current.startY;
        const scrollDelta = (deltaY / maxTop) * overflow;
        el.scrollTop = drag.current.startScroll + scrollDelta;
      };

      const onUp = (e: PointerEvent) => {
        drag.current = null;
        setActive(false);
        reveal();
        thumbRef.current?.releasePointerCapture(e.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [reveal],
  );

  if (!enabled) return null;

  return (
    <div
      ref={trackRef}
      className="overlay-scrollbar"
      data-visible={visible ? "true" : "false"}
      data-active={active ? "true" : "false"}
      aria-hidden="true"
    >
      <button
        ref={thumbRef}
        type="button"
        tabIndex={-1}
        className="overlay-scrollbar__thumb"
        onPointerDown={onThumbPointerDown}
      />
    </div>
  );
}
