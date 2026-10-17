import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileStickyCta } from "./MobileStickyCta";
import { OverlayScrollbar } from "./OverlayScrollbar";
import { RouteScrollReset } from "./RouteScrollReset";
import { ScrollToTop } from "./ScrollToTop";

/** Public marketing chrome rendered above `<main>`. */
export function PageShellTop() {
  return (
    <>
      <Header />
      <div className="site-header-spacer" aria-hidden />
    </>
  );
}

/** Public marketing chrome rendered below `<main>`. */
export function PageShellBottom() {
  return (
    <>
      <Footer />
      <RouteScrollReset />
      <ScrollToTop />
      <MobileStickyCta />
      <OverlayScrollbar />
    </>
  );
}
