"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { formatCartAmount } from "@/lib/cart/format";
import type { CartLineItem } from "@/lib/cart/types";

interface CartLineItemsProps {
  items: CartLineItem[];
  disabled?: boolean;
  compact?: boolean;
  onQuantityChange?: (lineItemId: string, quantity: number) => void;
  onRemove?: (lineItemId: string) => void;
}

export default function CartLineItems({
  items,
  disabled = false,
  compact = false,
  onQuantityChange,
  onRemove,
}: Readonly<CartLineItemsProps>) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article key={item.id} className="border border-black/8 bg-[#fbfbf8] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {item.thumbnail && (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden border border-black/10 bg-white">
                <Image
                  src={item.thumbnail}
                  alt={item.productTitle ?? item.title}
                  fill
                  className="object-cover object-center"
                />
              </div>
            )}

            <div className="flex flex-1 items-start justify-between gap-4">
              <div className="space-y-2">
                <div>
                  <p className="font-semibold text-[#111111]">{item.productTitle ?? item.title}</p>
                  {item.variantTitle ? (
                    <p className="text-xs uppercase tracking-[0.16em] text-[#6b7280]">
                      {item.variantTitle}
                    </p>
                  ) : null}
                </div>

                {item.selectedOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {item.selectedOptions.map((option) => (
                      <span
                        key={`${item.id}-${option.optionTitle}-${option.value}`}
                        className="border border-black/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5f6368]"
                      >
                        {option.optionTitle ? `${option.optionTitle}: ` : ""}
                        {option.value}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="text-right">
                <p className="font-semibold text-[#111111]">
                  {formatCartAmount(item.total, item.currencyCode)}
                </p>
                <p className="text-xs text-[#6b7280]">
                  {formatCartAmount(item.unitPrice, item.currencyCode)} x {item.quantity}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="inline-flex h-10 items-center border border-[#111111] bg-white">
              <button
                type="button"
                aria-label={`Reducir cantidad de ${item.productTitle ?? item.title}`}
                className="flex h-full w-10 items-center justify-center text-[#111111]"
                disabled={disabled || !onQuantityChange}
                onClick={() => onQuantityChange?.(item.id, item.quantity - 1)}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex h-full min-w-10 items-center justify-center border-x border-[#111111] px-3 text-sm font-semibold text-[#111111]">
                {item.quantity}
              </span>
              <button
                type="button"
                aria-label={`Aumentar cantidad de ${item.productTitle ?? item.title}`}
                className="flex h-full w-10 items-center justify-center text-[#111111]"
                disabled={disabled || !onQuantityChange}
                onClick={() => onQuantityChange?.(item.id, item.quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {!compact ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || !onRemove}
                onClick={() => onRemove?.(item.id)}
              >
                <Trash2 className="h-4 w-4" />
                Quitar
              </Button>
            ) : (
              <button
                type="button"
                className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280] transition hover:text-[#d71920]"
                disabled={disabled || !onRemove}
                onClick={() => onRemove?.(item.id)}
              >
                Quitar
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
