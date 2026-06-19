import { SectionHeading } from "@/components/SectionHeading";

export type FAQItem = {
  question: string;
  answer: string;
};

type FAQProps = {
  items: readonly FAQItem[];
  heading?: string;
  showHeading?: boolean;
};

export function FAQ({
  items,
  heading = "Frequently Asked Questions",
  showHeading = true,
}: FAQProps) {
  if (items.length === 0) return null;

  return (
    <div>
      {showHeading ? <SectionHeading>{heading}</SectionHeading> : null}
      <div className={showHeading ? "mt-6 space-y-4" : "space-y-4"}>
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm"
          >
            <summary className="cursor-pointer list-none font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
              {item.question}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
