import {
  BuildingIcon,
  DropletIcon,
  HomeIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "@/components/icons/StrokeIcons";

const TRUST_ITEMS = [
  {
    id: "experience",
    title: "30+ Years Combined Industry Experience",
    description:
      "Practical contractor experience in dam linings, waterproofing and water storage across South Africa.",
    Icon: ShieldCheckIcon,
  },
  {
    id: "systems",
    title: "HDPE, PVC & Bitumen",
    description:
      "Dam linings, steel water tanks, reservoir lining and waterproofing systems for varied applications.",
    Icon: DropletIcon,
  },
  {
    id: "clients",
    title: "Farms, Mines & Estates",
    description:
      "Serving farms, mines, game lodges and commercial properties with tailored water storage solutions.",
    Icon: BuildingIcon,
  },
  {
    id: "coverage",
    title: "Nationwide Service",
    description:
      "Projects and enquiries handled across South Africa with clear communication and practical advice.",
    Icon: MapPinIcon,
  },
  {
    id: "local",
    title: "Locally Owned",
    description:
      "South African contractor focused on practical workmanship and supplier-backed materials where applicable.",
    Icon: HomeIcon,
  },
] as const;

/** Homepage dark trust band for service hub pages. */
export function TrustStrip() {
  return (
    <section className="home-why-choose" aria-labelledby="trust-strip-heading">
      <div className="home-why-choose__trust">
        <div className="home-why-choose__trust-inner">
          <header className="home-why-choose__trust-header">
            <p className="home-why-choose__eyebrow">WHY DAMTECH</p>
            <h2 id="trust-strip-heading" className="home-why-choose__title">
              Experience You Can Trust
            </h2>
            <span className="home-why-choose__divider" aria-hidden />
            <p className="home-why-choose__intro">
              Practical dam linings, waterproofing and water storage solutions
              backed by clear communication and proven workmanship.
            </p>
          </header>

          <ul className="home-why-choose__cards">
            {TRUST_ITEMS.map((item) => (
              <li key={item.id} className="home-why-choose__card">
                <span className="home-why-choose__card-icon-wrap" aria-hidden>
                  <item.Icon className="home-why-choose__card-icon" />
                </span>
                <h3 className="home-why-choose__card-title">{item.title}</h3>
                <span className="home-why-choose__card-accent" aria-hidden />
                <p className="home-why-choose__card-text">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
