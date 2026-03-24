import { z } from "zod";

import { cmsDocumentKeys } from "@/lib/data/default-cms";

const optionalLinkTarget = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .regex(/^(#[A-Za-z0-9_-]+|\/[A-Za-z0-9/_\-.]+)$/, "Usa una ancla, ruta local o URL completa."),
  z.string().trim().url("Introduce una URL valida."),
]);

export const cmsDocumentSchema = z
  .object({
    key: z.enum(cmsDocumentKeys),
    kind: z.enum(["legal", "system"]),
    slug: z
      .string()
      .trim()
      .min(2, "El slug es obligatorio.")
      .max(80, "Maximo 80 caracteres.")
      .regex(/^[a-z0-9-]+$/, "Usa solo minusculas, numeros y guiones."),
    title: z
      .string()
      .trim()
      .min(3, "El titulo necesita mas claridad.")
      .max(120, "Maximo 120 caracteres."),
    summary: z
      .string()
      .trim()
      .max(240, "Maximo 240 caracteres."),
    body_markdown: z
      .string()
      .trim()
      .max(12000, "El contenido es demasiado largo para este MVP."),
    cta_label: z.string().trim().max(40, "Maximo 40 caracteres.").optional().or(z.literal("")),
    cta_href: optionalLinkTarget,
    seo_title: z.string().trim().max(70, "Maximo 70 caracteres."),
    seo_description: z.string().trim().max(180, "Maximo 180 caracteres."),
    is_published: z.boolean(),
  })
  .superRefine((values, context) => {
    if (!values.is_published) {
      return;
    }

    if (values.summary.length < 10) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["summary"],
        message: "Publica con un resumen mas claro.",
      });
    }

    if (values.body_markdown.length < 20) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body_markdown"],
        message: "El contenido publicado necesita mas detalle.",
      });
    }

    if (values.seo_title.length < 8) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["seo_title"],
        message: "Completa el SEO title antes de publicar.",
      });
    }

    if (values.seo_description.length < 20) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["seo_description"],
        message: "Completa la meta description antes de publicar.",
      });
    }
  });

export type CmsDocumentValues = z.infer<typeof cmsDocumentSchema>;
