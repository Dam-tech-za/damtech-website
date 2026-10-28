"use client";

import Link from "next/link";
import type { AttentionItem } from "@/lib/admin/dashboard/attention";

type AttentionPanelProps = {
  items: AttentionItem[];
  onNavigate?: () => void;
};

/** List of things to act on now, each with one action. Used in the header bell. */
export function AttentionPanel({ items, onNavigate }: AttentionPanelProps) {
  return (
    <section className="dash-attention" aria-labelledby="dash-attention-title">
      <h2 id="dash-attention-title" className="dash-attention__title">
        Needs attention
      </h2>
      {items.length === 0 ? (
        <p className="dash-attention__clear">
          You&apos;re all caught up. New enquiries, late payments and project
          steps will show up here.
        </p>
      ) : (
        <ul className="dash-attention__list">
          {items.map((item) => (
            <li
              key={item.id}
              className={`dash-attention__item dash-attention__item--${item.tone}`}
            >
              <Link href={item.href} className="dash-attention__link" onClick={onNavigate}>
                <span className="dash-attention__text">
                  <span className="dash-attention__label">{item.label}</span>
                  <span className="dash-attention__hint">{item.hint}</span>
                </span>
                <span className="dash-attention__action admin-btn admin-btn--sm admin-btn--outline" aria-hidden>
                  {item.action}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
