import Link from "next/link";

type PostCallToActionProps = {
  heading: string;
  description?: string;
  buttonText: string;
  buttonHref: string;
};

export function PostCallToAction({
  heading,
  description,
  buttonText,
  buttonHref,
}: PostCallToActionProps) {
  return (
    <aside className="mt-10 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-navy sm:text-2xl">{heading}</h2>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          {description}
        </p>
      ) : null}
      <Link href={buttonHref} className="btn-primary mt-5 inline-flex">
        {buttonText}
      </Link>
    </aside>
  );
}
