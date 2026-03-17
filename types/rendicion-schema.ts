import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const TipoDocumentoGastoEnum = z.enum(['FACTURA', 'RECIBO', 'BOLETA']);
export type TipoDocumentoGasto = z.infer<typeof TipoDocumentoGastoEnum>;

export const EstadoGastoEnum = z.enum(['PENDIENTE', 'COMPROBADO', 'RECHAZADO']);
export type EstadoGasto = z.infer<typeof EstadoGastoEnum>;

export const TipoDeclaracionEnum = z.enum(['COMPLETA', 'PARCIAL', 'NEGATIVA']);
export type TipoDeclaracion = z.infer<typeof TipoDeclaracionEnum>;

export type WizardStepRendicion =
  | 'SELECCION'
  | 'GASTOS_RESPALDO'
  | 'DECLARACION_JURADA';

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
  montoTotal: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  /** Monto líquido sin impuestos */
  montoNeto: z.number().min(0.01, 'El monto neto debe ser mayor a 0'),
  estado: EstadoGastoEnum.optional(),
});

export type GastoRendicion = z.infer<typeof GastoRendicionSchema>;

/**
 * Declaración jurada que el usuario firma al finalizar la rendición.
 */
export const DeclaracionJuradaSchema = z.object({
  tipoDeclaracion: TipoDeclaracionEnum.optional(),
  /** El usuario confirma que los gastos declarados son reales */
  confirmaDatosVeridicos: z.boolean().refine((val) => val === true, {
    message: 'Debes confirmar que los datos son verídicos',
  }),
  /** El usuario acepta la política de devolución de saldos */
  aceptaPoliticaDevolucion: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar la política de devolución de saldos',
  }),
  /** Monto que el usuario declara devolver (si tipoDeclaracion !== 'COMPLETA') */
  montoADevolver: z.number().min(0).optional(),
  observaciones: z.string().optional(),
});

export type DeclaracionJurada = z.infer<typeof DeclaracionJuradaSchema>;

/**
 * Un gasto sin respaldo oficial (pasaje de taxi, compra en mercado, etc.)
 * que se registra directamente en la declaración jurada.
 */
export const GastoSinRespaldoSchema = z.object({
  fechaGasto: z.union([z.string(), z.date()]).optional(),
  detalle: z.string().min(1, 'El detalle es requerido'),
  monto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
});

export type GastoSinRespaldo = z.infer<typeof GastoSinRespaldoSchema>;

// ---------------------------------------------------------------------------
// Schema principal del formulario de rendición
// ---------------------------------------------------------------------------

export const CreateRendicionSchema = z.object({
  // --- Paso 1: SELECCION ---
  /** ID de la SolicitudResponse que se está rindiendo */
  solicitudId: z.number().min(1, 'Debes seleccionar una solicitud'),
  /** Fecha en que se realiza la rendición (ISO date string YYYY-MM-DD) */
  fechaRendicion: z
    .string()
    .min(1, 'La fecha de rendición es requerida')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),

  // --- Paso 2: GASTOS_RESPALDO ---
  gastos: z.array(GastoRendicionSchema).optional(),

  // --- Paso 3: DECLARACION_JURADA ---
  /** Gastos sin respaldo oficial (taxi, compras, etc.) */
  gastosSinRespaldo: z.array(GastoSinRespaldoSchema).optional(),
  /** Declaración jurada final con términos y condiciones */
  declaracionJurada: DeclaracionJuradaSchema.optional(),

  /** Observaciones generales de la rendición */
  observaciones: z.string().optional(),
});

export type CreateRendicionInput = z.infer<typeof CreateRendicionSchema>;

// ---------------------------------------------------------------------------
// Default values para useForm
// ---------------------------------------------------------------------------

export const defaultRendicionValues: CreateRendicionInput = {
  solicitudId: 0,
  fechaRendicion: new Date().toISOString().split('T')[0],
  gastos: [],
  gastosSinRespaldo: [],
  observaciones: '',
  declaracionJurada: {
    tipoDeclaracion: undefined,
    confirmaDatosVeridicos: false,
    aceptaPoliticaDevolucion: false,
    montoADevolver: undefined,
    observaciones: '',
  },
};
