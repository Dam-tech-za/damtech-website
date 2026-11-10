import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hero } from "@/components/Hero";
import { SiteSection } from "@/components/SiteSection";
import { PvcCheckoutForm } from "@/components/shop/PvcCheckoutForm";
import {
  getPvcLinerBySku,
  parsePvcLinerColour,
  PVC_LINER_DEFAULT_COLOUR,
  PVC_LINER_MAX_QUANTITY,
  PVC_LINER_PAGE_PATH,
} from "@/lib/shop/pvc-liners";

export const metadata: Metadata = {
  title: { absolute: "Checkout | Damtech" },
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function PvcCheckoutPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const liner = getPvcLinerBySku(first(params.sku));
  if (!liner) redirect(PVC_LINER_PAGE_PATH);
  const colour = parsePvcLinerColour(first(params.colour)) ?? PVC_LINER_DEFAULT_COLOUR;
  const qty = Math.trunc(Number(first(params.qty) || "1"));
  const quantity = Number.isFinite(qty) ? Math.min(PVC_LINER_MAX_QUANTITY, Math.max(1, qty)) : 1;

  return (
    <>
      <Hero
        compact
        eyebrow="Checkout"
        title="Your order details"
        description="Choose delivery or collection and enter your details. You pay on PayFast in the next step."
        showActions={false}
      />
      <SiteSection>
        <PvcCheckoutForm liner={liner} colour={colour} initialQuantity={quantity} />
      </SiteSection>
    </>
  );
}
