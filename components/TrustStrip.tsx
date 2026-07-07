const TRUST_ITEMS = [
  "30+ years combined industry experience",
  "HDPE, PVC and bitumen systems",
  "Farms, mines, game lodges and commercial properties",
  "Nationwide service",
  "10-year material warranty where applicable",
] as const;

export function TrustStrip() {
  return (
    <section className="border-y border-slate-200 bg-white" aria-label="Why Damtech">
      <div className="site-container content-wrap--sm">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TRUST_ITEMS.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-navy"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
