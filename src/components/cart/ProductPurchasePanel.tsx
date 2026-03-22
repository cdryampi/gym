"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/types";

interface ProductPurchasePanelProps {
  product: Product;
}

function resolveInitialOptionValue(product: Product) {
  if ((product.variants?.length ?? 0) <= 1) {
    return product.options?.[0]?.values[0] ?? null;
  }

  return null;
}

export default function ProductPurchasePanel({ product }: Readonly<ProductPurchasePanelProps>) {
  const { addItem, isBusy, error } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptionValue, setSelectedOptionValue] = useState<string | null>(
    resolveInitialOptionValue(product),
  );
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const primaryOption = product.options?.[0];
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const hasMultipleRealVariants = variants.length > 1;

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) {
      return null;
    }

    if (variants.length === 1) {
      return variants[0];
    }

    return (
      variants.find((variant) =>
        variant.options.some((option) => option.value === selectedOptionValue),
      ) ?? null
    );
  }, [selectedOptionValue, variants]);

  const isUnavailable =
    product.stock_status === "out_of_stock" || product.stock_status === "coming_soon";
  const maxQuantity =
    selectedVariant?.inventory_quantity && selectedVariant.inventory_quantity > 0
      ? Math.min(selectedVariant.inventory_quantity, 10)
      : 10;

  async function handleAddToCart() {
    if (!selectedVariant?.id) {
      setSelectionError("Selecciona una variante valida antes de anadir al carrito.");
      return;
    }

    setSelectionError(null);
    await addItem({
      variantId: selectedVariant.id,
      quantity,
    });
  }

  return (
    <div className="space-y-6">
      {primaryOption ? (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#111111]">
            {primaryOption.title}
          </p>
          <div className="flex flex-wrap gap-2">
            {primaryOption.values.map((value, index) => {
              const isSelected =
                selectedOptionValue === value ||
                (!selectedOptionValue && index === 0 && !hasMultipleRealVariants);

              return (
                <button
                  key={`${primaryOption.id}-${value}`}
                  type="button"
                  className={`inline-flex min-h-11 items-center border px-5 text-[11px] font-bold uppercase tracking-wider transition ${
                    isSelected
                      ? "border-[#d71920] bg-white text-[#d71920]"
                      : "border-[#d5d9e2] bg-white text-[#111111] hover:border-[#d71920]/35"
                  }`}
                  onClick={() => {
                    setSelectedOptionValue(value);
                    setSelectionError(null);
                  }}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#111111]">Cantidad</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="inline-flex h-12 w-fit items-center border border-[#111111] bg-white">
            <button
              type="button"
              aria-label="Reducir cantidad"
              className="flex h-full w-12 items-center justify-center text-[#111111]"
              disabled={isBusy || quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="flex h-full min-w-12 items-center justify-center border-x border-[#111111] px-4 text-sm font-semibold text-[#111111]">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Aumentar cantidad"
              className="flex h-full w-12 items-center justify-center text-[#111111]"
              disabled={isBusy || quantity >= maxQuantity}
              onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <Button
            type="button"
            className="h-12 rounded-none bg-[#d71920] px-8 text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:bg-[#bf161c]"
            disabled={isBusy || isUnavailable || (hasMultipleRealVariants && !selectedVariant)}
            onClick={() => {
              void handleAddToCart();
            }}
          >
            {isUnavailable ? "No disponible" : isBusy ? "Anadiendo..." : "Anadir al carrito"}
          </Button>
        </div>
      </div>

      {selectionError ? <p className="text-sm text-red-700">{selectionError}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
