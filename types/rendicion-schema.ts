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

export const TipoDeclaracionEnum = z.enum(['COMPLETA', 'PARCIAL', 'NEGATIVA']);
export type TipoDeclaracion = z.infer<typeof TipoDeclaracionEnum>;

export type WizardStepRendicion =
  | 'SELECCION'
  | 'GASTOS_RESPALDO'
  | 'INFORME_GASTOS';

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
  /** URL de respaldo documental (opcional en esta etapa) */
  urlComprobante: z
    .string()
    .url('La URL del comprobante no es válida')
    .optional(),
  /**
   * Sub-categoría de retención — sólo aplica para RECIBO/BOLETA en gastos GENERALES.
   * Determina el factor de retención: BIEN=0.92, SERVICIO=0.84, ALQUILER=0.84.
   */
  tipoRetencion: TipoRetencionEnum.optional(),
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

/**
 * Actividad individual del Anexo 7 (Informe de Gastos).
 */
export const ActividadInformeSchema = z.object({
  fecha: z.union([z.string().min(1, 'La fecha es requerida'), z.date()]),
  lugar: z.string().min(1, 'El lugar es requerido'),
  personaInstitucion: z
    .string()
    .min(1, 'La persona o institución es requerida'),
  actividadesRealizadas: z
    .string()
    .min(1, 'La descripción de actividades es requerida'),
});

export type ActividadInforme = z.infer<typeof ActividadInformeSchema>;

/**
 * Anexo 7: Informe de Gastos (resumen de actividades realizadas en viaje).
 */
export const InformeGastosSchema = z.object({
  fechaInicio: z.union([
    z.string().min(1, 'La fecha de inicio es requerida'),
    z.date(),
  ]),
  fechaFin: z.union([
    z.string().min(1, 'La fecha de fin es requerida'),
    z.date(),
  ]),
  actividades: z
    .array(ActividadInformeSchema)
    .min(1, 'Debes registrar al menos una actividad'),
});

export type InformeGastos = z.infer<typeof InformeGastosSchema>;

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

  // --- Paso 4: INFORME_GASTOS ---
  informeGastos: InformeGastosSchema.optional().nullable(),

  // --- Confirmación final (Modal de Declaración Jurada) ---
  /** Gastos sin respaldo oficial (taxi, compras, etc.) */
  gastosSinRespaldo: z.array(GastoSinRespaldoSchema).optional(),
  /** Declaración jurada final con términos y condiciones */
  declaracionJurada: DeclaracionJuradaSchema,

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
  informeGastos: {
    fechaInicio: '',
    fechaFin: '',
    actividades: [],
  },
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
