import { z } from 'zod';

export const itemGastoCompraSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .min(1, 'La descripción es obligatoria')
    .max(500),
  cantidad: z.coerce
    .number({ invalid_type_error: 'Ingrese una cantidad válida' })
    .positive('La cantidad debe ser mayor a 0'),
  uso: z.string().trim().max(100).optional().or(z.literal('')),
  costoUnitario: z.coerce
    .number({ invalid_type_error: 'Ingrese un precio válido' })
    .min(0, 'El precio no puede ser negativo'),
});

export const solicitudCompraSchema = z.object({
  aprobadorId: z
    .number({ invalid_type_error: 'Seleccione un aprobador' })
    .int()
    .positive('Seleccione un aprobador'),
  poaId: z
    .number({ invalid_type_error: 'Seleccione una partida presupuestaria' })
    .int()
    .positive('Seleccione una partida presupuestaria'),
  motivoSolicitud: z
    .string()
    .trim()
    .min(1, 'El motivo de solicitud es obligatorio')
    .max(500),
  proyecto: z.string().trim().max(200).optional().or(z.literal('')),
  chequeANombreDe: z
    .string()
    .trim()
    .min(1, 'Ingrese el nombre en el cheque')
    .max(200),
  descripcion: z.string().trim().max(1000).optional().or(z.literal('')),
  items: z
    .array(itemGastoCompraSchema)
    .min(1, 'Agregue al menos un ítem de gasto'),
});

export type SolicitudCompraFormData = z.infer<typeof solicitudCompraSchema>;
export type ItemGastoCompraFormData = z.infer<typeof itemGastoCompraSchema>;
