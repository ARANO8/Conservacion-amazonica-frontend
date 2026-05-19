import { z } from 'zod';

export const cuadroPrecioSchema = z.object({
  precioUnitario: z.coerce.number().min(0).default(0),
  noMenciona: z.boolean().default(false),
});

export const cuadroItemSchema = z.object({
  descripcion: z.string().trim().min(1, 'El detalle es obligatorio').max(500),
  cantidad: z.coerce
    .number({ invalid_type_error: 'Cantidad inválida' })
    .positive('La cantidad debe ser mayor a 0'),
  unidad: z.string().trim().max(50).optional().or(z.literal('')),
  ganadoraIndex: z.number().nullable().default(null),
  precios: z.array(cuadroPrecioSchema),
});

export const cuadroComparativoSchema = z.object({
  lugarFecha: z.string().trim().max(200).optional().or(z.literal('')),
  observaciones: z.string().trim().max(1000).optional().or(z.literal('')),
  recomendadaIndex: z.number().nullable().default(null),
  cotizaciones: z
    .array(
      z.object({
        cotizacionId: z.number(),
        proveedorNombre: z.string(),
      })
    )
    .min(2, 'Selecciona al menos 2 cotizaciones para comparar'),
  items: z
    .array(cuadroItemSchema)
    .min(1, 'Agrega al menos un ítem para comparar'),
});

export type CuadroComparativoFormData = z.infer<typeof cuadroComparativoSchema>;
export type CuadroItemFormData = z.infer<typeof cuadroItemSchema>;
