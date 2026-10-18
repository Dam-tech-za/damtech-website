import Link from "next/link";
import type { AttentionItem } from "@/lib/admin/dashboard/attention";

type AttentionPanelProps = {
  items: AttentionItem[];
};

/** Top of the overview: the short list of things an admin should act on now. */
export function AttentionPanel({ items }: AttentionPanelProps) {
  return (
    <section className="dash-attention" aria-labelledby="dash-attention-title">
      <h2 id="dash-attention-title" className="dash-attention__title">
        Needs attention
      </h2>
      {items.length === 0 ? (
        <p className="dash-attention__clear">
          Nothing needs attention right now. New enquiries and orders will
          appear here as they arrive.
        </p>
      ) : (
        <ul className="dash-attention__list">
          {items.map((item) => (
            <li
              key={item.id}
              className={`dash-attention__item dash-attention__item--${item.tone}`}
            >
              <Link href={item.href} className="dash-attention__link">
                <span className="dash-attention__label">{item.label}</span>
                <span className="dash-attention__hint">{item.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
