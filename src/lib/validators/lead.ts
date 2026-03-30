import { z } from "zod";

export const leadStatusSchema = z.object({
  status: z.enum(["new", "contacted", "closed"]),
});

const optionalLeadDateTimeSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(new Date(value).getTime()), {
    message: "Introduce una fecha valida.",
  });

export const leadSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Introduce tu nombre.").max(80, "Maximo 80 caracteres."),
  email: z.string().trim().email("Introduce un email valido."),
  phone: z.string().trim().max(40, "Maximo 40 caracteres.").optional().or(z.literal("")),
  message: z.string().trim().min(12, "Cuentanos un poco mas.").max(2000, "Maximo 2000 caracteres."),
  status: z.enum(["new", "contacted", "closed"]).default("new"),
});

export const leadFollowUpSchema = z.object({
  contacted_at: optionalLeadDateTimeSchema,
  channel: z.string().trim().max(80, "Maximo 80 caracteres."),
  outcome: z.string().trim().max(140, "Maximo 140 caracteres."),
  next_step: z.string().trim().max(500, "Maximo 500 caracteres."),
});

export type LeadValues = z.infer<typeof leadSchema>;
export type LeadFollowUpValues = z.infer<typeof leadFollowUpSchema>;
