import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileStickyCta } from "./MobileStickyCta";
import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <>
      <Header />
      <main className="flex-1 pb-[4.5rem] lg:pb-0">{children}</main>
      <Footer />
      <MobileStickyCta />
    </>
  );
}
