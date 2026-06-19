import Link from "next/link";
import type { ReactNode } from "react";

type CTAProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
};

export function CTA({
  title = "Request a FREE Quote",
  description = "Call us or submit our contact form and we'll be in touch with a tailored solution.",
  children,
}: CTAProps) {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-navy sm:text-3xl">
                {title}
              </h2>
              <p className="mt-3 text-slate-600">{description}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/quote" className="btn-primary w-full sm:w-auto">
                  Request a Quote
                </Link>
                <Link href="/contact" className="btn-secondary w-full sm:w-auto">
                  Contact Damtech
                </Link>
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
