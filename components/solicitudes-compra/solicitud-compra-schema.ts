import { z } from 'zod';

export const itemGastoCompraSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .min(1, 'La descripción es obligatoria')
    .max(500),
  cantidad: z.preprocess(
    (v) => (v === null ? undefined : v),
    z.coerce
      .number({ invalid_type_error: 'Ingrese una cantidad válida' })
      .positive('La cantidad debe ser mayor a 0')
  ),
  uso: z.string().trim().max(100).optional().or(z.literal('')),
  costoUnitario: z.preprocess(
    (v) => (v === null ? undefined : v),
    z.coerce
      .number({ invalid_type_error: 'Ingrese un precio válido' })
      .min(0, 'El precio no puede ser negativo')
  ),
});

export const pagoParcialSchema = z.object({
  monto: z.preprocess(
    (v) => (v === null ? undefined : v),
    z.coerce
      .number({ invalid_type_error: 'Ingrese un monto válido' })
      .positive('El monto debe ser mayor a 0')
  ),
  fechaPago: z.union([z.string(), z.date()]),
  descripcion: z.string().trim().max(500).optional().or(z.literal('')),
});

export const solicitudCompraSchema = z
  .object({
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
    items: z.array(itemGastoCompraSchema).default([]),

    // --- Contratos de consultoría ---
    // Se activa cuando la partida POA seleccionada contiene "CONSULTOR".
    esConsultoria: z.boolean().default(false),
    partidaNombre: z.string().optional().or(z.literal('')),
    tipoDocumento: z.enum(['FACTURA', 'RECIBO']).default('RECIBO'),
    montoLiquido: z.preprocess(
      (v) => (v === null || v === '' ? undefined : v),
      z.coerce
        .number({ invalid_type_error: 'Ingrese un monto válido' })
        .min(0)
        .optional()
    ),
    pagos: z.array(pagoParcialSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.esConsultoria) {
      if (data.items.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items'],
          message: 'Agregue al menos un ítem de gasto',
        });
      }
      return;
    }

    if (!data.montoLiquido || data.montoLiquido <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['montoLiquido'],
        message: 'Ingrese el monto del contrato',
      });
      return;
    }

    if (data.pagos.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pagos'],
        message: 'Defina al menos un pago',
      });
      return;
    }

    const suma = data.pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
    if (Math.abs(suma - data.montoLiquido) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pagos'],
        message: `Los pagos suman ${suma.toFixed(2)} y el contrato es de ${data.montoLiquido.toFixed(2)}`,
      });
    }
  });

export type SolicitudCompraFormData = z.infer<typeof solicitudCompraSchema>;
export type ItemGastoCompraFormData = z.infer<typeof itemGastoCompraSchema>;
export type PagoParcialFormData = z.infer<typeof pagoParcialSchema>;
