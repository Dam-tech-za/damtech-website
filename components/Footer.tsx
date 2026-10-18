import Link from "next/link";
import {
  FOOTER_COMPANY_LINKS,
  FOOTER_REGION_LINKS,
  FOOTER_SERVICE_LINKS,
  FOOTER_WATERPROOFING_LINKS,
  formatOfficeAddressLines,
  OFFICES,
  phoneTel,
  siteConfig,
  whatsAppUrl,
} from "@/lib/site";

export function Footer() {
  return (
    <footer id="site-footer" className="dt-footer pb-[4.5rem] lg:pb-0">
      <div className="site-shell">
        <div className="dt-footer__cta">
          <p className="dt-footer__cta-title dt-display dt-display--lg">
            Planning a dam, tank or waterproofing project?
          </p>
          <div className="dt-footer__cta-actions">
            <Link href="/quote" className="dt-btn dt-btn--cyan dt-btn--lg">
              Request a Free Quote
            </Link>
            <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className="dt-btn dt-btn--ghost dt-btn--lg">
              WhatsApp
            </a>
          </div>
        </div>

        <div className="dt-footer__grid">
          <div>
            <p className="dt-footer__brand">{siteConfig.name}</p>
            <p className="dt-footer__about">{siteConfig.defaultDescription}</p>
            <p className="dt-footer__heading">Where we work</p>
            <ul className="dt-footer__list">
              {FOOTER_REGION_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} scroll={true}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="dt-footer__heading">Water Storage &amp; Dam Linings</p>
            <ul className="dt-footer__list">
              {FOOTER_SERVICE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} scroll={true}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="dt-footer__heading">Waterproofing</p>
            <ul className="dt-footer__list">
              {FOOTER_WATERPROOFING_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} scroll={true}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="dt-footer__heading" style={{ marginTop: "2rem" }}>
              Company
            </p>
            <ul className="dt-footer__list">
              {FOOTER_COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} scroll={true}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="dt-footer__heading">Quote</p>
            <ul className="dt-footer__list">
              <li>
                <Link href="/quote" scroll={true} className="font-semibold">
                  Request a Free Quote
                </Link>
              </li>
              <li>
                <a href={`tel:${phoneTel}`}>{siteConfig.phone}</a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
              </li>
              <li>
                <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="dt-footer__offices">
          <p className="dt-footer__heading" style={{ gridColumn: "1 / -1", margin: 0 }}>
            Service areas
          </p>
          {OFFICES.map((office) => (
            <div key={office.id} className="dt-footer__office">
              <p className="dt-footer__office-name">{office.name}</p>
              {formatOfficeAddressLines(office).map((line) => (
                <p key={line}>{line}</p>
              ))}
              <a href={`tel:${office.phone.replace(/\s/g, "")}`}>{office.phone}</a>
            </div>
          ))}
          <p style={{ margin: 0 }}>
            We operate from Western Cape and Gauteng bases and mobilise nationwide.
            Clients are served on site — these are not walk-in offices.
          </p>
        </div>

        <div className="dt-footer__legal">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p>Dam linings · Steel reservoirs · Waterproofing</p>
        </div>
      </div>
      <p className="dt-footer__wordmark" aria-hidden>
        Damtech
      </p>
    </footer>
  );
}
