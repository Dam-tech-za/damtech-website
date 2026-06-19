import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileStickyCta } from "./MobileStickyCta";
import { ScrollToTop } from "./ScrollToTop";
import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <>
      <Header />
      <div className="site-header-spacer" aria-hidden />
      <main className="flex-1 pb-[4.5rem] lg:pb-0">{children}</main>
      <Footer />
      <ScrollToTop />
      <MobileStickyCta />
    </>
  );
}
