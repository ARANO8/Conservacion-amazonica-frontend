import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const TipoDocumentoGastoEnum = z.enum([
  'FACTURA',
  'RECIBO',
  'BOLETA',
  'LV',
  'DJ',
  'PPT',
  'PAT',
  'PVT',
]);
export type TipoDocumentoGasto = z.infer<typeof TipoDocumentoGastoEnum>;

/**
 * Sub-categoría de retención para gastos GENERALES con RECIBO o BOLETA.
 * Replica el campo `tipoGastoId` de solicitud-gastos.tsx (COMPRA/SERVICIO/ALQUILER).
 */
export const TipoRetencionEnum = z.enum(['BIEN', 'SERVICIO', 'ALQUILER']);
export type TipoRetencion = z.infer<typeof TipoRetencionEnum>;

export const EstadoGastoEnum = z.enum(['PENDIENTE', 'COMPROBADO', 'RECHAZADO']);
export type EstadoGasto = z.infer<typeof EstadoGastoEnum>;

export type WizardStepRendicion = 'SELECCION' | 'GASTOS_RESPALDO';

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

/**
 * Un gasto individual que el usuario está rindiendo con su documento respaldo.
 */
export const GastoRendicionSchema = z.object({
  /** ID del gasto original de la solicitud al que se imputa esta rendición */
  solicitudItemId: z.number().optional(),
  concepto: z.string().min(1, 'El concepto es requerido'),
  detalle: z.string().optional(),
  tipoDocumento: TipoDocumentoGastoEnum,
  numeroDocumento: z.string().optional(),
  proveedor: z.string().optional(),
  fechaDocumento: z.union([z.string(), z.date()]).optional(),
  /** Monto real gastado (con impuestos) */
  montoBruto: z.number().min(0.01, 'El monto bruto debe ser mayor a 0'),
  /** Monto de impuestos/retenciones calculadas */
  montoImpuestos: z
    .number()
    .min(0, 'El monto de impuestos no puede ser negativo'),
  /** Alias de compatibilidad para cálculos antiguos */
  montoTotal: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  /** Monto líquido sin retenciones (calculado automáticamente) */
  montoNeto: z.number().min(0.01, 'El monto neto debe ser mayor a 0'),
  estado: EstadoGastoEnum.optional(),
  /** ID del presupuesto (partida POA) al que se imputa este gasto */
  partidaId: z.number().min(1, 'Debes seleccionar una partida presupuestaria'),
  /**
   * Sub-categoría de retención — sólo aplica para RECIBO/BOLETA en gastos GENERALES.
   * Determina el factor de retención: BIEN=0.92, SERVICIO=0.84, ALQUILER=0.84.
   */
  tipoRetencion: TipoRetencionEnum.optional(),
});

export type GastoRendicion = z.infer<typeof GastoRendicionSchema>;

// ---------------------------------------------------------------------------
// Schema principal del formulario de rendición
// ---------------------------------------------------------------------------

export const CreateRendicionSchema = z.object({
  // --- Paso 1: SELECCION ---
  /** ID de la SolicitudResponse que se está rindiendo */
  solicitudId: z.number().min(1, 'Debes seleccionar una solicitud'),
  /** Usuario aprobador inmediato de la rendición */
  aprobadorActualId: z
    .number()
    .min(1, 'Debes seleccionar un aprobador inmediato'),

  // --- Paso 3: GASTOS_RESPALDO ---
  gastos: z.array(GastoRendicionSchema).optional(),

  /** URL obligatoria con los comprobantes digitales adjuntos */
  comprobanteUrl: z
    .string()
    .url('Debes ingresar una URL válida para los comprobantes'),

  /** Observaciones generales de la rendición */
  observaciones: z.string().optional(),
});

export type CreateRendicionInput = z.infer<typeof CreateRendicionSchema>;

// ---------------------------------------------------------------------------
// Default values para useForm
// ---------------------------------------------------------------------------

export const defaultRendicionValues: CreateRendicionInput = {
  solicitudId: 0,
  aprobadorActualId: 0,
  gastos: [],
  comprobanteUrl: '',
  observaciones: '',
};
