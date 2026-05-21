"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "../hooks/use-cart";
import PublicInlineAlert from "@/components/public/PublicInlineAlert";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/types";
import { cn } from "@/lib/utils";

interface ProductPurchasePanelProps {
  product: Product;
  previewMode?: boolean;
}

function resolveInitialOptionValue(product: Product) {
  if ((product.variants?.length ?? 0) <= 1) {
    return product.options?.[0]?.values[0] ?? null;
  }

  return null;
}

function PreviewProductPurchasePanel({
  product,
}: Readonly<Pick<ProductPurchasePanelProps, "product">>) {
  const primaryOption = product.options?.[0];
  const previewOptionValue = primaryOption?.values[0] ?? product.name;

  return (
    <div className="space-y-10">
      {primaryOption ? (
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7a7f87]">
            {primaryOption.title}
          </p>
          <div className="flex flex-wrap gap-2">
            {primaryOption.values.map((value, index) => {
              const isSelected = value === previewOptionValue || (!previewOptionValue && index === 0);

              return (
                <span
                  key={`${primaryOption.id}-${value}`}
                  className={cn(
                    "inline-flex h-12 items-center border px-6 text-[11px] font-black uppercase tracking-widest transition-all",
                    isSelected
                      ? "border-[#111111] bg-[#111111] text-white shadow-lg"
                      : "border-black/10 bg-white text-[#7a7f87]",
                  )}
                >
                  {value}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7a7f87]">
          Cantidad
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
          <div className="inline-flex h-14 w-fit items-center border border-black/10 bg-white shadow-sm">
            <span className="flex h-full w-14 items-center justify-center text-black/20">
              <Minus className="h-4 w-4" />
            </span>
            <span className="flex h-full min-w-14 items-center justify-center border-x border-black/10 px-6 font-mono text-sm font-bold text-[#111111]">
              01
            </span>
            <span className="flex h-full w-14 items-center justify-center text-black/20">
              <Plus className="h-4 w-4" />
            </span>
          </div>

          <Button
            type="button"
            className="h-14 flex-1 cursor-not-allowed rounded-none bg-[#d71920] px-10 text-[11px] font-black uppercase tracking-[0.2em] text-white opacity-50 shadow-xl sm:flex-none"
            disabled
          >
            Reserva disponible en storefront
          </Button>
        </div>
      </div>

      <div className="space-y-4 border-t border-black/5 pt-6">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a7f87] italic leading-relaxed">
          Esta ficha es solo una preview del dashboard. La reserva asistida real se activa en la
          version publicada.
        </p>
      </div>
    </div>
  );
}

function InteractiveProductPurchasePanel({
  product,
}: Readonly<Pick<ProductPurchasePanelProps, "product">>) {
  const { addItem, isBusy } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptionValue, setSelectedOptionValue] = useState<string | null>(
    resolveInitialOptionValue(product),
  );
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
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

  // Handle auto-reset of success state after 3 seconds
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isSuccess]);

  const isUnavailable =
    product.stock_status === "out_of_stock" || product.stock_status === "coming_soon";
  const maxQuantity =
    selectedVariant?.inventory_quantity && selectedVariant.inventory_quantity > 0
      ? Math.min(selectedVariant.inventory_quantity, 10)
      : 10;

  async function handleAddToCart() {
    if (!selectedVariant?.id) {
      setSelectionError("Selecciona una variante antes de anadir al carrito.");
      return;
    }

    setSelectionError(null);
    setPurchaseError(null);
    setIsSuccess(false);

    const result = await addItem({
      variantId: selectedVariant.id,
      quantity,
    });

    if (result) {
      const isAuthError = /autenticado|auth|unauthenticated|login/i.test(result);
      setPurchaseError(isAuthError ? "Tu sesión ha caducado. Inicia sesión para continuar." : result);
    } else {
      setIsSuccess(true);
    }
  }

  return (
    <div className="space-y-10">
      {primaryOption ? (
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7a7f87]">
            Seleccionar {primaryOption.title}
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
                  className={cn(
                    "inline-flex h-12 items-center border px-6 text-[11px] font-black uppercase tracking-widest transition-all",
                    isSelected
                      ? "translate-y-[-2px] border-[#111111] bg-[#111111] text-white shadow-lg"
                      : "border-black/10 bg-white text-[#7a7f87] hover:border-[#d71920]/40 hover:text-[#111111]",
                  )}
                  onClick={() => {
                    setSelectedOptionValue(value);
                    setSelectionError(null);
                    setPurchaseError(null);
                    setIsSuccess(false);
                  }}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7a7f87]">
          Cantidad
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
          <div className="inline-flex h-14 w-fit items-center border border-black/10 bg-white shadow-sm">
            <button
              type="button"
              aria-label="Reducir cantidad"
              className="flex h-full w-14 items-center justify-center text-[#111111] transition-colors hover:bg-[#fbfbf8] disabled:opacity-20"
              disabled={isBusy || quantity <= 1}
              onClick={() => {
                setQuantity((current) => Math.max(1, current - 1));
                setPurchaseError(null);
                setIsSuccess(false);
              }}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="flex h-full min-w-14 items-center justify-center border-x border-black/10 px-6 font-mono text-sm font-bold text-[#111111]">
              {quantity.toString().padStart(2, "0")}
            </span>
            <button
              type="button"
              aria-label="Aumentar cantidad"
              className="flex h-full w-14 items-center justify-center text-[#111111] transition-colors hover:bg-[#fbfbf8] disabled:opacity-20"
              disabled={isBusy || quantity >= maxQuantity}
              onClick={() => {
                setQuantity((current) => Math.min(maxQuantity, current + 1));
                setPurchaseError(null);
                setIsSuccess(false);
              }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <Button
            type="button"
            className={cn(
              "h-14 flex-1 rounded-none px-12 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all sm:flex-none",
              isSuccess
                ? "bg-emerald-600 hover:bg-emerald-600 cursor-default"
                : "bg-[#d71920] hover:bg-[#111111]"
            )}
            disabled={isBusy || isUnavailable || (hasMultipleRealVariants && !selectedVariant) || isSuccess}
            onClick={() => {
              void handleAddToCart();
            }}
          >
            {isUnavailable ? "AGOTADO" : isBusy ? "PROCESANDO..." : isSuccess ? "¡AÑADIDO!" : "Añadir a la reserva"}
          </Button>
        </div>
      </div>

      {isSuccess && (
        <PublicInlineAlert
          tone="success"
          title="Producto añadido"
          message="Se ha añadido correctamente a tu reserva."
          compact
        />
      )}

      {(selectionError || purchaseError) && (
        <PublicInlineAlert
          tone="error"
          title="No pudimos añadir este producto"
          message={selectionError || purchaseError || "Se produjo un error inesperado."}
          compact
        />
      )}
    </div>
  );
}

export function ProductPurchasePanel({
  product,
  previewMode = false,
}: Readonly<ProductPurchasePanelProps>) {
  if (previewMode) {
    return <PreviewProductPurchasePanel product={product} />;
  }

  return <InteractiveProductPurchasePanel product={product} />;
}
