"use client";

import Image from "next/image";
import { useId, useState, type KeyboardEvent } from "react";
import {
  PRODUCT_GALLERY_ASPECT,
  type CatalogueImageAsset,
} from "@/lib/catalogue";

export function ProductGallery({
  productName,
  images,
}: {
  productName: string;
  images: readonly CatalogueImageAsset[];
}) {
  const labelId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  function move(delta: number) {
    setActiveIndex(
      (current) => (current + delta + images.length) % images.length,
    );
  }

  function onThumbKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(images.length - 1);
    }
  }

  if (!active) {
    return (
      <div className="catalogue-gallery catalogue-gallery--empty">
        <div
          className="catalogue-gallery__frame"
          style={{ aspectRatio: PRODUCT_GALLERY_ASPECT }}
        >
          <p>
            A product-specific photograph is not published for {productName}{" "}
            yet. The VAT-inclusive price and specifications on this page are the
            commercial details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="catalogue-gallery">
      <figure className="catalogue-gallery__stage">
        <div
          className="catalogue-gallery__frame"
          style={{ aspectRatio: PRODUCT_GALLERY_ASPECT }}
        >
          <Image
            src={active.src}
            alt={active.alt}
            width={active.width}
            height={active.height}
            className={`catalogue-gallery__image catalogue-gallery__image--${active.role}`}
            sizes="(max-width: 768px) 100vw, 48vw"
            quality={85}
            priority={activeIndex === 0}
            fetchPriority={activeIndex === 0 ? "high" : "auto"}
          />
        </div>
        {active.caption ? (
          <figcaption className="catalogue-product__caption">
            {active.caption}
          </figcaption>
        ) : null}
      </figure>

      {images.length > 1 ? (
        <div
          className="catalogue-gallery__thumbs"
          role="tablist"
          aria-labelledby={labelId}
          onKeyDown={onThumbKeyDown}
        >
          <p id={labelId} className="sr-only">
            Product photographs
          </p>
          {images.map((image, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={`${image.src}-${image.alt}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={image.alt}
                tabIndex={selected ? 0 : -1}
                className={`catalogue-gallery__thumb${selected ? " is-active" : ""}`}
                onClick={() => setActiveIndex(index)}
              >
                <Image
                  src={image.src}
                  alt=""
                  width={image.width}
                  height={image.height}
                  className="catalogue-gallery__thumb-image"
                  sizes="96px"
                  quality={70}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
