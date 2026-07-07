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
    <article className="card flex h-full flex-col hover:-translate-y-0.5">
      <h3 className="text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      <Link
        href={href}
        className="link-row mt-3"
      >
        {cta} →
      </Link>
    </article>
  );
}
