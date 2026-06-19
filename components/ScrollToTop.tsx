"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const SHOW_AFTER_PX = 160;

function getScrollY(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

function subscribe(onStoreChange: () => void) {
  const onScroll = () => onStoreChange();
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("scroll", onScroll);
  };
}

function getScrollSnapshot() {
  return getScrollY() > SHOW_AFTER_PX;
}

function getServerScrollSnapshot() {
  return false;
}

function subscribeClient(onStoreChange: () => void) {
  onStoreChange();
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerClientSnapshot() {
  return false;
}

function ArrowUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      className="h-5 w-5"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 11 6-6 6 6" />
    </svg>
  );
}

export function ScrollToTop() {
  const isClient = useSyncExternalStore(
    subscribeClient,
    getClientSnapshot,
    getServerClientSnapshot,
  );
  const visible = useSyncExternalStore(
    subscribe,
    getScrollSnapshot,
    getServerScrollSnapshot,
  );

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!isClient) {
    return null;
  }

  return createPortal(
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed right-4 z-[100] flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-200/90 bg-navy text-white shadow-[0_8px_24px_rgba(15,39,68,0.28)] transition-[opacity,transform] duration-300 hover:border-water hover:bg-water focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-water bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-6 ${
        visible
          ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-3 scale-95 opacity-0"
      }`}
    >
      <ArrowUpIcon />
    </button>,
    document.body,
  );
}
