import { z } from "zod";

export const documentoSchema = z.object({
  type: z.enum(["recibido", "enviado"], {
    error: "El tipo es obligatorio",
  }),
  document_id: z.string().max(100).optional().nullable(),
  description: z
    .string()
    .min(1, "La descripción es obligatoria")
    .max(500, "Máximo 500 caracteres"),
  signed_by: z.string().max(200).optional().nullable(),
  addressed_to: z.string().max(200).optional().nullable(),
  document_date: z.string().min(1, "La fecha es obligatoria"),
});

export type DocumentoFormValues = z.infer<typeof documentoSchema>;
