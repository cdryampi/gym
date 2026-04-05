import { z } from "zod";

export const marketingTestimonialModerationStatuses = ["pending", "approved", "rejected"] as const;

export const marketingTestimonialModerationStatusSchema = z.enum(
  marketingTestimonialModerationStatuses,
);

export const memberMarketingTestimonialSchema = z.object({
  quote: z
    .string()
    .trim()
    .min(20, "Cuenta un poco mas sobre tu experiencia.")
    .max(320, "Maximo 320 caracteres."),
  rating: z
    .number()
    .int("Selecciona una puntuacion valida.")
    .min(1, "Selecciona al menos una estrella.")
    .max(5, "Maximo 5 estrellas."),
});

export const moderateMarketingTestimonialSchema = z.object({
  id: z.string().uuid("La reseña no es valida."),
  moderationStatus: marketingTestimonialModerationStatusSchema,
});

export type MemberMarketingTestimonialValues = z.infer<typeof memberMarketingTestimonialSchema>;
export type MarketingTestimonialModerationStatus = z.infer<
  typeof marketingTestimonialModerationStatusSchema
>;
