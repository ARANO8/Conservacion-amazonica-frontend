import { z } from 'zod';

export const lineaCotizacionSchema = z.object({
  cantidad: z.coerce
    .number({ invalid_type_error: 'Ingrese una cantidad válida' })
    .positive('La cantidad debe ser mayor a 0'),
  unidad: z.string().trim().max(50).optional().or(z.literal('')),
  detalle: z.string().trim().min(1, 'El detalle es obligatorio').max(500),
  precioUnitario: z.coerce
    .number({ invalid_type_error: 'Ingrese un precio válido' })
    .min(0, 'El precio no puede ser negativo'),
});

export const cotizacionSchema = z
  .object({
    tipo: z.enum(['PROPIA', 'EXTERNA']).default('PROPIA'),
    fecha: z.string().min(1, 'La fecha es obligatoria'),
    proveedorNombre: z
      .string()
      .trim()
      .min(1, 'El nombre del proveedor es obligatorio')
      .max(200),
    proveedorTelefono: z.string().trim().max(50).optional().or(z.literal('')),
    proveedorDireccion: z.string().trim().max(300).optional().or(z.literal('')),
    proveedorCorreo: z
      .string()
      .trim()
      .email('Correo electrónico inválido')
      .optional()
      .or(z.literal('')),
    garantia: z.string().trim().max(200).optional().or(z.literal('')),
    disponibilidad: z.string().trim().max(200).optional().or(z.literal('')),
    duracionCotizacion: z.string().trim().max(200).optional().or(z.literal('')),
    emiteFactura: z.boolean().default(false),
    observaciones: z.string().trim().max(1000).optional().or(z.literal('')),
    adjuntoUrl: z.string().trim().max(2000).optional().or(z.literal('')),
    lineas: z
      .array(lineaCotizacionSchema)
      .min(1, 'Agregue al menos un ítem a la cotización'),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === 'EXTERNA') {
      const url = data.adjuntoUrl?.trim() ?? '';
      if (!url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'La URL del documento es obligatoria para cotizaciones externas',
          path: ['adjuntoUrl'],
        });
      } else {
        try {
          new URL(url);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'Ingrese una URL válida (ej: https://drive.google.com/...)',
            path: ['adjuntoUrl'],
          });
        }
      }
    }
  });

export type CotizacionFormData = z.infer<typeof cotizacionSchema>;
export type LineaCotizacionFormData = z.infer<typeof lineaCotizacionSchema>;
