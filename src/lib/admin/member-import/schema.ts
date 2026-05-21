import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const dateSchema = z
  .string()
  .refine((val) => !val || dateRegex.test(val), {
    message: "La fecha debe tener el formato YYYY-MM-DD",
  })
  .transform((val) => val || null);

export const csvRowSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("El correo electrónico no es válido")
    .trim()
    .toLowerCase(),
  first_name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .trim(),
  last_name: z
    .string()
    .min(1, "El apellido no puede estar vacío")
    .trim(),
  phone: z
    .string()
    .min(7, "El teléfono debe tener al menos 7 dígitos")
    .trim(),
  membership_plan: z
    .string()
    .min(1, "El plan de membresía es obligatorio")
    .trim(),
  membership_start_date: z
    .string()
    .min(1, "La fecha de inicio es obligatoria")
    .refine((val) => dateRegex.test(val), {
      message: "La fecha de inicio debe tener el formato YYYY-MM-DD",
    })
    .trim(),
  membership_end_date: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val ? val.trim() : null))
    .refine((val) => !val || dateRegex.test(val), {
      message: "La fecha de fin debe tener el formato YYYY-MM-DD",
    }),
  status: z.enum(["active", "inactive", "frozen"], {
    message: "El estado debe ser: active, inactive o frozen",
  }),
  document_id: z.string().optional().nullable().or(z.literal("")).transform(val => val?.trim() || null),
  birth_date: dateSchema.optional().nullable(),
  address: z.string().optional().nullable().or(z.literal("")).transform(val => val?.trim() || null),
  emergency_contact_name: z.string().optional().nullable().or(z.literal("")).transform(val => val?.trim() || null),
  emergency_contact_phone: z.string().optional().nullable().or(z.literal("")).transform(val => val?.trim() || null),
  notes: z.string().optional().nullable().or(z.literal("")).transform(val => val?.trim() || null),
  send_welcome_email: z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase() === "true"),
});

export type CsvImportRowInput = z.infer<typeof csvRowSchema>;
