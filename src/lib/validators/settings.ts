import { z } from "zod";

import { RESEND_ALLOWED_FROM_DOMAIN, isAllowedTransactionalMailbox } from "@/lib/email/policy";
import { topbarVariants } from "@/lib/topbar";

const optionalText = z.string().trim().max(180, "El texto es demasiado largo.").optional().or(z.literal(""));
const optionalUrl = z.union([z.literal(""), z.string().trim().url("Introduce una URL valida.")]);
const optionalAssetOrUrl = z.union([
  z.literal(""),
  z.string().trim().regex(/^\/[A-Za-z0-9/_\-.]+$/, "Usa una ruta local valida o una URL completa."),
  z.string().trim().url("Introduce una URL valida."),
]);
const optionalLinkTarget = z.union([
  z.literal(""),
  z.string().trim().regex(/^(#[A-Za-z0-9_-]+|\/[A-Za-z0-9/_\-.]+)$/, "Usa una ancla, ruta local o URL completa."),
  z.string().trim().url("Introduce una URL valida."),
]);
const optionalDateTime = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Introduce una fecha valida."),
]);

export const siteSettingsSchema = z
  .object({
    site_name: z.string().trim().min(2, "El nombre del sitio es obligatorio.").max(80, "Maximo 80 caracteres."),
    site_tagline: z
      .string()
      .trim()
      .min(10, "La descripcion corta necesita algo mas de contexto.")
      .max(140, "Maximo 140 caracteres."),
    hero_badge: z.string().trim().min(3, "El badge superior necesita mas claridad.").max(60, "Maximo 60 caracteres."),
    hero_title: z.string().trim().min(10, "El titular principal es demasiado corto.").max(140, "Maximo 140 caracteres."),
    hero_description: z
      .string()
      .trim()
      .min(20, "La descripcion principal necesita algo mas de contexto.")
      .max(320, "Maximo 320 caracteres."),
    hero_primary_cta: z.string().trim().min(2, "El CTA principal es obligatorio.").max(40, "Maximo 40 caracteres."),
    hero_secondary_cta: z.string().trim().min(2, "El CTA secundario es obligatorio.").max(40, "Maximo 40 caracteres."),
    hero_video_url: optionalAssetOrUrl,
    topbar_enabled: z.boolean(),
    topbar_variant: z.enum(topbarVariants),
    topbar_text: z.string().trim().max(180, "Maximo 180 caracteres.").optional().or(z.literal("")),
    topbar_cta_label: z.string().trim().max(40, "Maximo 40 caracteres.").optional().or(z.literal("")),
    topbar_cta_url: optionalLinkTarget,
    topbar_expires_at: optionalDateTime,
    hero_highlight_one: z.string().trim().min(10).max(120),
    hero_highlight_two: z.string().trim().min(10).max(120),
    hero_highlight_three: z.string().trim().min(10).max(120),
    contact_email: z.string().trim().email("Introduce un email valido."),
    notification_email: z.string().trim().email("Introduce un email valido."),
    transactional_from_email: z.string().trim().email("Introduce un email valido."),
    contact_phone: optionalText,
    whatsapp_url: optionalUrl,
    address: optionalText,
    opening_hours: z.string().trim().min(10, "Indica un horario util.").max(180, "Maximo 180 caracteres."),
    seo_title: z.string().trim().min(10, "El SEO title necesita mas detalle.").max(70, "Maximo 70 caracteres."),
    seo_description: z
      .string()
      .trim()
      .min(30, "La meta description necesita mas contexto.")
      .max(180, "Maximo 180 caracteres."),
    seo_keywords: z.string().trim().max(240, "Maximo 240 caracteres."),
    seo_og_image_url: optionalUrl,
    seo_canonical_url: optionalUrl,
    footer_text: z.string().trim().min(10, "El footer necesita algo mas de contenido.").max(240, "Maximo 240 caracteres."),
  })
  .superRefine((values, context) => {
    if (values.topbar_enabled) {
      if (!values.topbar_text?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Escribe el mensaje del topbar.",
          path: ["topbar_text"],
        });
      }

      if (!values.topbar_expires_at?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indica una fecha limite para el topbar.",
          path: ["topbar_expires_at"],
        });
      }
    }

    if (!isAllowedTransactionalMailbox(values.transactional_from_email)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El remitente transaccional debe usar el dominio @${RESEND_ALLOWED_FROM_DOMAIN}.`,
        path: ["transactional_from_email"],
      });
    }
  });

export type SiteSettingsValues = z.infer<typeof siteSettingsSchema>;
