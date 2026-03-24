import { z } from "zod";

import { productStockStatuses } from "@/data/types";

const optionalText = z.string().trim().optional().or(z.literal(""));
const positiveMoney = z.coerce.number().min(0, "Introduce un precio valido.");
const orderNumber = z.coerce.number().int().min(0, "El orden no puede ser negativo.");

export const storeCategorySchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio.").max(80, "Maximo 80 caracteres."),
  slug: optionalText,
  description: z.string().trim().max(240, "Maximo 240 caracteres.").optional().or(z.literal("")),
  parent_id: optionalText,
  order: orderNumber,
  active: z.boolean(),
});

export const storeProductSchema = z.object({
  name: z.string().trim().min(3, "El nombre es obligatorio.").max(120, "Maximo 120 caracteres."),
  slug: optionalText,
  category_id: z.string().trim().min(1, "Selecciona una categoria."),
  eyebrow: optionalText,
  short_description: z
    .string()
    .trim()
    .min(10, "La descripcion corta necesita algo mas de contexto.")
    .max(220, "Maximo 220 caracteres."),
  description: z
    .string()
    .trim()
    .min(20, "La descripcion completa necesita algo mas de contexto.")
    .max(2400, "Maximo 2400 caracteres."),
  price: positiveMoney,
  paypal_price_usd: z
    .union([z.literal(""), z.coerce.number().min(0, "Introduce un precio PayPal valido.")])
    .refine((value) => value !== "", "El precio estimado PayPal es obligatorio."),
  compare_price: z.union([z.literal(""), z.coerce.number().min(0)]).optional(),
  discount_label: optionalText,
  currency: z.string().trim().min(3, "La moneda es obligatoria.").max(3, "Usa un codigo ISO."),
  stock_status: z.enum(productStockStatuses),
  featured: z.boolean(),
  pickup_only: z.boolean(),
  pickup_note: optionalText,
  pickup_summary: optionalText,
  pickup_eta: optionalText,
  tags_text: optionalText,
  highlights_text: optionalText,
  benefits_text: optionalText,
  usage_steps_text: optionalText,
  images_text: z.string().trim().min(3, "Añade al menos una imagen."),
  specifications_text: optionalText,
  cta_label: z.string().trim().min(2, "El CTA es obligatorio.").max(60, "Maximo 60 caracteres."),
  order: orderNumber,
  active: z.boolean(),
});

export type StoreCategoryInput = z.input<typeof storeCategorySchema>;
export type StoreCategoryValues = z.output<typeof storeCategorySchema>;
export type StoreProductInput = z.input<typeof storeProductSchema>;
export type StoreProductValues = z.output<typeof storeProductSchema>;
