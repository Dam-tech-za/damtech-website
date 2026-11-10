"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatZarExactAmount } from "@/lib/catalogue/format";
import {
  PVC_LINER_CHECKOUT_PATH,
  PVC_LINER_COLOUR_IMAGES,
  PVC_LINER_COLOUR_LABELS,
  PVC_LINER_COLOURS,
  PVC_LINER_DEFAULT_COLOUR,
  PVC_LINER_MANUFACTURE_LABEL,
  PVC_LINER_MAX_QUANTITY,
  type PvcLiner,
  type PvcLinerColour,
} from "@/lib/shop/pvc-liners";

/** Gallery plus buy box for one liner's product page. */
export function PvcLinerBuyBox({ liner }: { liner: PvcLiner }) {
  const [colour, setColour] = useState<PvcLinerColour>(PVC_LINER_DEFAULT_COLOUR);
  const [quantity, setQuantity] = useState(1);
  const checkoutHref = `${PVC_LINER_CHECKOUT_PATH}?sku=${encodeURIComponent(liner.sku)}&colour=${colour}&qty=${quantity}`;

  return (
    <div className="catalogue-product">
      <div className="catalogue-product__media pvc-product__gallery">
        {PVC_LINER_COLOURS.map((option) => {
          const image = PVC_LINER_COLOUR_IMAGES[option];
          return (
            <Image
              key={option}
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(min-width: 900px) 32rem, 100vw"
              className="pvc-product__image"
              hidden={option !== colour}
              priority={option === PVC_LINER_DEFAULT_COLOUR}
            />
          );
        })}
      </div>
      <div className="catalogue-buybox">
        <p className="catalogue-buybox__price">
          {formatZarExactAmount(liner.priceInclVatZar)} <span className="pvc-product__vat">incl. VAT</span>
        </p>
        <p className="catalogue-buybox__notice">{liner.summary}</p>
        <p className="catalogue-buybox__meta">{PVC_LINER_MANUFACTURE_LABEL}</p>
        <p className="catalogue-buybox__meta">Delivery is a fixed fee per province, shown at checkout</p>
        <fieldset className="pvc-picker__gsm">
          <legend className="form-label">Colour (same price)</legend>
          {PVC_LINER_COLOURS.map((option) => (
            <label key={option} className="pvc-picker__radio">
              <input
                type="radio"
                name="pvc-product-colour"
                value={option}
                checked={colour === option}
                onChange={() => setColour(option)}
              />
              <span className={`pvc-picker__swatch pvc-picker__swatch--${option}`} aria-hidden />
              <span>{PVC_LINER_COLOUR_LABELS[option]}</span>
            </label>
          ))}
        </fieldset>
        <div className="catalogue-buybox__qty">
          <label htmlFor="pvc-product-qty" className="form-label">
            Quantity
          </label>
          <input
            id="pvc-product-qty"
            type="number"
            min={1}
            max={PVC_LINER_MAX_QUANTITY}
            step={1}
            value={quantity}
            onChange={(event) => {
              const n = Math.trunc(Number(event.target.value));
              setQuantity(Number.isFinite(n) ? Math.min(PVC_LINER_MAX_QUANTITY, Math.max(1, n)) : 1);
            }}
            className="form-input catalogue-buybox__qty-input"
          />
        </div>
        <p className="catalogue-buybox__line">Total: {formatZarExactAmount(liner.priceInclVatZar * quantity)}</p>
        <Link href={checkoutHref} className="btn-primary catalogue-cta">
          Buy now
        </Link>
        <p className="catalogue-buybox__help">
          Secure payment by card or Instant EFT through PayFast. Installation is not included.
        </p>
      </div>
    </div>
  );
}
