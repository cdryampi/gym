import { z } from "zod";

const optionalShortText = z.string().trim().max(180, "Maximo 180 caracteres.").optional().or(z.literal(""));

const marketingPlanFeatureSchema = z.object({
  label: z.string().trim().min(2, "La caracteristica necesita texto.").max(120, "Maximo 120 caracteres."),
  included: z.boolean(),
});

const marketingPlanSchema = z.object({
  id: z.string().min(1, "El identificador es obligatorio."),
  title: z.string().trim().min(2, "El nombre del plan es obligatorio.").max(80, "Maximo 80 caracteres."),
  description: optionalShortText,
  price_label: z.string().trim().min(1, "El precio visible es obligatorio.").max(40, "Maximo 40 caracteres."),
  billing_label: z.string().trim().min(1, "El periodo comercial es obligatorio.").max(40, "Maximo 40 caracteres."),
  badge: z.string().trim().max(40, "Maximo 40 caracteres.").optional().or(z.literal("")),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  order: z.number().int().min(0),
  features: z.array(marketingPlanFeatureSchema).min(1, "Añade al menos una caracteristica."),
});

const marketingScheduleRowSchema = z.object({
  id: z.string().min(1, "El identificador es obligatorio."),
  label: z.string().trim().min(2, "El titulo del horario es obligatorio.").max(80, "Maximo 80 caracteres."),
  description: optionalShortText,
  opens_at: z.string().trim().min(2, "La hora de apertura es obligatoria.").max(40, "Maximo 40 caracteres."),
  closes_at: z.string().trim().min(2, "La hora de cierre es obligatoria.").max(40, "Maximo 40 caracteres."),
  is_active: z.boolean(),
  order: z.number().int().min(0),
});

export const marketingContentSchema = z
  .object({
    plans: z.array(marketingPlanSchema).min(1, "Necesitas al menos un plan visible o editable."),
    scheduleRows: z
      .array(marketingScheduleRowSchema)
      .min(1, "Necesitas al menos una fila de horario visible o editable."),
  })
  .superRefine((values, context) => {
    const featuredPlans = values.plans.filter((plan) => plan.is_featured);

    if (featuredPlans.length > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Marca solo un plan como destacado.",
        path: ["plans"],
      });
    }
  });

export type MarketingContentValues = z.infer<typeof marketingContentSchema>;
export type MarketingPlanValues = MarketingContentValues["plans"][number];
export type MarketingPlanFeatureValues = MarketingPlanValues["features"][number];
export type MarketingScheduleRowValues = MarketingContentValues["scheduleRows"][number];
