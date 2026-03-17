"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  name: string;
  images: string[];
}

export default function ProductGallery({ name, images }: Readonly<ProductGalleryProps>) {
  const gallery = images.length > 0 ? images : ["/images/products/product-1.png"];
  const [activeImage, setActiveImage] = useState(gallery[0]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-[6px] border border-[#eadfd1] bg-[linear-gradient(145deg,#f6ead1_0%,#fbf7f0_100%)]">
        <Image
          src={activeImage}
          alt={name}
          fill
          className="object-contain p-8 md:p-12"
          sizes="(min-width: 1280px) 42vw, (min-width: 768px) 52vw, 100vw"
          priority
        />
      </div>

      {gallery.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {gallery.slice(0, 4).map((image, index) => {
            const isActive = image === activeImage;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                aria-label={`Ver imagen ${index + 1} de ${name}`}
                aria-pressed={isActive}
                onClick={() => setActiveImage(image)}
                className={`relative aspect-square overflow-hidden rounded-[4px] border bg-white transition ${
                  isActive
                    ? "border-[#d71920] shadow-[0_0_0_1px_rgba(215,25,32,0.1)]"
                    : "border-[#e5dfd6] hover:border-[#d71920]/50"
                }`}
              >
                <Image
                  src={image}
                  alt={`${name} miniatura ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 10vw, 22vw"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
