"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { searchPricingItemsAction } from "@/app/admin/pricing/actions";
import type { PricingItemRecord } from "@/lib/pricing/types";
import { formatZar } from "@/lib/estimating/money";

type Props = {
  onSelect: (item: PricingItemRecord) => void;
  /** Called when the user commits free text that is not a catalogue item. */
  onCustomText?: (text: string) => void;
  showCost?: boolean;
  placeholder?: string;
  initialValue?: string;
  autoFocus?: boolean;
  id?: string;
  ariaLabel?: string;
  className?: string;
};

type PopupRect = { top: number; left: number; width: number; placement: "below" | "above" };

const MIN_WIDTH = 680;
const MAX_WIDTH = 1000;
const MARGIN = 16;

export function PricingItemCombobox({
  onSelect,
  onCustomText,
  showCost = false,
  placeholder = "Search item code or name",
  initialValue = "",
  autoFocus = false,
  id,
  ariaLabel = "Search catalogue items",
  className,
}: Props) {
  const generatedId = useId();
  const listId = `${id ?? generatedId}-listbox`;
  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<PricingItemRecord[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pending, startTransition] = useTransition();
  const [rect, setRect] = useState<PopupRect | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const requestSeq = useRef(0);

  const computeRect = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const r = input.getBoundingClientRect();
    const viewportW = document.documentElement.clientWidth;
    const viewportH = document.documentElement.clientHeight;
    const width = Math.max(
      Math.min(r.width, viewportW - MARGIN * 2),
      Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, viewportW - MARGIN * 2)),
    );
    let left = r.left;
    if (left + width > viewportW - MARGIN) left = viewportW - MARGIN - width;
    if (left < MARGIN) left = MARGIN;
    const spaceBelow = viewportH - r.bottom;
    const placement: "below" | "above" = spaceBelow < 260 && r.top > spaceBelow ? "above" : "below";
    const top = placement === "below" ? r.bottom + 4 : r.top - 4;
    setRect({ top, left, width, placement });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    computeRect();
    const onScroll = () => computeRect();
    const onResize = () => computeRect();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, computeRect, results.length]);

  useEffect(() => {
    function onDocPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        popupRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointer);
    return () => document.removeEventListener("mousedown", onDocPointer);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function runSearch(term: string) {
    const seq = ++requestSeq.current;
    startTransition(async () => {
      const result = await searchPricingItemsAction(term);
      if (seq !== requestSeq.current) return; // stale response
      if (result.ok) {
        setResults(result.items);
        setActiveIndex(result.items.length ? 0 : -1);
        setOpen(true);
      }
    });
  }

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(value.trim()), 220);
  }

  function commitSelect(item: PricingItemRecord) {
    onSelect(item);
    setQuery("");
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open && results.length) setOpen(true);
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      if (open && activeIndex >= 0 && results[activeIndex]) {
        event.preventDefault();
        commitSelect(results[activeIndex]);
      } else if (onCustomText && query.trim()) {
        event.preventDefault();
        onCustomText(query.trim());
        setQuery("");
        setOpen(false);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.focus();
    }
  }

  const popup =
    open && rect && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popupRef}
            className={`pricing-combobox__popup${
              showCost ? " pricing-combobox__popup--cost" : ""
            }`}
            style={{
              position: "fixed",
              top: rect.placement === "below" ? rect.top : undefined,
              bottom:
                rect.placement === "above"
                  ? document.documentElement.clientHeight - rect.top
                  : undefined,
              left: rect.left,
              width: rect.width,
            }}
          >
            <div className="pricing-combobox__popup-head" aria-hidden>
              <span>Item</span>
              <span>Category</span>
              <span>Unit</span>
              <span className="pricing-combobox__num">Sell</span>
              {showCost ? <span className="pricing-combobox__num">Cost</span> : null}
              <span>Status</span>
            </div>
            <ul
              id={listId}
              role="listbox"
              className="pricing-combobox__list"
              aria-label="Catalogue results"
            >
              {pending && !results.length ? (
                <li className="pricing-combobox__empty" aria-disabled>
                  Searching…
                </li>
              ) : null}
              {!pending && !results.length ? (
                <li className="pricing-combobox__empty" aria-disabled>
                  {onCustomText
                    ? "No matches — press Enter to add as a custom item"
                    : "No matching items"}
                </li>
              ) : null}
              {results.map((item, index) => {
                const margin =
                  showCost &&
                  item.defaultCost != null &&
                  item.defaultSellPrice != null &&
                  item.defaultSellPrice > 0
                    ? (
                        ((item.defaultSellPrice - item.defaultCost) /
                          item.defaultSellPrice) *
                        100
                      ).toFixed(2)
                    : null;
                return (
                  <li
                    key={item.id}
                    id={`${listId}-opt-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`pricing-combobox__option${
                      index === activeIndex ? " is-active" : ""
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      commitSelect(item);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <div className="pricing-combobox__cell pricing-combobox__cell--item">
                      <span className="pricing-combobox__name">
                        {item.quoteDescription || item.name}
                      </span>
                      <span className="pricing-combobox__code">{item.itemCode}</span>
                    </div>
                    <div className="pricing-combobox__cell">
                      <span className="pricing-combobox__badge">{item.category}</span>
                    </div>
                    <div className="pricing-combobox__cell">{item.quoteUnit}</div>
                    <div className="pricing-combobox__cell pricing-combobox__num">
                      {item.defaultSellPrice != null
                        ? formatZar(item.defaultSellPrice)
                        : "—"}
                    </div>
                    {showCost ? (
                      <div className="pricing-combobox__cell pricing-combobox__num pricing-combobox__cost">
                        {item.defaultCost != null ? formatZar(item.defaultCost) : "—"}
                        {margin ? (
                          <span className="pricing-combobox__margin">{margin}%</span>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="pricing-combobox__cell">
                      <span className="pricing-combobox__status">
                        {item.priceStatus === "current" || !item.priceStatus
                          ? "Current"
                          : item.priceStatus}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={containerRef}
      className={`pricing-combobox${className ? ` ${className}` : ""}`}
    >
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
        }
        aria-label={ariaLabel}
        className="admin-control pricing-combobox__input"
        placeholder={placeholder}
        value={query}
        autoFocus={autoFocus}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length) setOpen(true);
        }}
      />
      {popup}
    </div>
  );
}
