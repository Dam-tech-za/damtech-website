import Link from "next/link";

type ServiceCardProps = {
  title: string;
  description: string;
  href: string;
  cta?: string;
};

export function ServiceCard({
  title,
  description,
  href,
  cta = "Learn More",
}: ServiceCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-water/40 hover:shadow-md">
      <h3 className="text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex text-sm font-semibold text-water hover:text-navy"
      >
        {cta} →
      </Link>
    </article>
  );
}
