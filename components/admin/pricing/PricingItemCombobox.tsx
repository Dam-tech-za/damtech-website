"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
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
    }
  }

  return (
    <div
      ref={containerRef}
      className={`pricing-combobox${className ? ` ${className}` : ""}`}
    >
      <input
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
      {open ? (
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
          {results.map((item, index) => (
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
              <div className="pricing-combobox__option-main">
                <span className="pricing-combobox__code">{item.itemCode}</span>
                <span className="pricing-combobox__name">
                  {item.quoteDescription || item.name}
                </span>
              </div>
              <div className="pricing-combobox__option-meta">
                <span className="pricing-combobox__category">
                  {item.category} · {item.quoteUnit}
                </span>
                <span className="pricing-combobox__price">
                  {item.defaultSellPrice != null
                    ? `Sell ${formatZar(item.defaultSellPrice)}`
                    : "No sell price"}
                </span>
                {showCost && item.defaultCost != null ? (
                  <span className="pricing-combobox__cost">
                    Cost {formatZar(item.defaultCost)}
                    {item.defaultSellPrice
                      ? ` · Margin ${(
                          ((item.defaultSellPrice - item.defaultCost) /
                            item.defaultSellPrice) *
                          100
                        ).toFixed(2)}%`
                      : ""}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
