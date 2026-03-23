import { z } from 'zod';

const proyectoSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  cuentaBancaria: z
    .object({
      id: z.number(),
      nombre: z.string(),
      numeroCuenta: z.string(),
      banco: z.string(),
      moneda: z.string().optional(),
      tipoCuenta: z.string().optional(),
    })
    .optional(),
});

const grupoSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  codigo: z.string().optional(),
});

const partidaSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  codigo: z.string().optional(),
});

const actividadSchema = z.object({
  id: z.number().optional(),
  nombre: z.string().optional(),
  detalleDescripcion: z.string().optional(),
});

const codigoPresupuestarioSchema = z.object({
  id: z.number().optional(),
  nombre: z.string().optional(),
  codigo: z.string().optional(),
  codigoCompleto: z.string().optional(),
  descripcion: z.string().optional(),
});

const poaSchema = z.object({
  id: z.number(),
  codigoPoa: z.string(),
  cantidad: z.number().optional(),
  costoUnitario: z.number().optional(),
  costoTotal: z.number().or(z.string()).optional(),
  saldoDisponible: z.number().or(z.string()).optional(),
  montoComprometido: z.number().or(z.string()).optional(),
  tieneCompromisos: z.boolean().optional(),
  proyectoId: z.number().optional(),
  grupoId: z.number().optional(),
  partidaId: z.number().optional(),
  actividadId: z.number().optional(),
  codigoPresupuestarioId: z.number().optional(),
  actividad: actividadSchema.optional(),
  codigoPresupuestario: codigoPresupuestarioSchema.optional(),
  estructura: z
    .object({
      proyecto: proyectoSchema.optional(),
      grupo: grupoSchema.optional(),
      partida: partidaSchema.optional(),
    })
    .optional(),
});

// Esquema Zod
export const formSchema = z.object({
  // Campos de Planificación (Paso 1)
  planificacionLugares: z
    .string()
    .min(1, 'El lugar de la actividad es requerido'),
  planificacionObjetivo: z.string().min(1, 'El objetivo es requerido'),
  actividades: z
    .array(
      z.object({
        fechaInicio: z.union([z.string(), z.date()]),
        fechaFin: z.union([z.string(), z.date()]),
        cantDias: z.number().optional(),
        actividadProgramada: z.string().min(1, 'Actividad requerida'),
        cantInstitucion: z.number().min(0),
        cantTerceros: z.number().min(0),
      })
    )
    .min(1, 'Debes agregar al menos una actividad'),

  // Campos visuales de Solicitud (Paso 2)
  interino: z.boolean().optional(),
  proyecto: z.union([z.string(), z.number()]).optional(),
  presupuestosIds: z.preprocess((value) => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => Number(item))
      .filter((item) => !Number.isNaN(item));
  }, z.array(z.number())),
  fuentesSeleccionadas: z
    .preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z.array(
        z.object({
          grupoId: z.union([z.string(), z.number()]).optional(),
          partidaId: z.union([z.string(), z.number()]).optional(),
          codigoPresupuestarioId: z.union([z.string(), z.number()]).optional(),
          poaId: z.number().nullable().optional(),
          poa: poaSchema.optional(),
          montoReservado: z.number().optional(),
          montoPresupuestado: z.number().optional(),
          saldoDisponible: z.number().optional(),
          isLocked: z.boolean().optional(),
        })
      )
    )
    .optional(),
  grupo: z.union([z.string(), z.number()]).optional(),
  partida: z.union([z.string(), z.number()]).optional(),
  codigoProyecto: z.union([z.string(), z.number()]).optional(),
  solicitante: z.string().optional(),
  fechaInicio: z.union([z.string(), z.date()]).optional(),
  fechaFin: z.union([z.string(), z.date()]).optional(),

  // Tabla 1: Viáticos / Pasajes
  viaticos: z
    .array(
      z.object({
        id: z.number().optional(),
        planificacionIndexes: z.array(z.number()).default([]).optional(),
        ciudad: z.string().optional(),
        destino: z.string().optional(),
        tipoDestino: z.enum(['INSTITUCIONAL', 'TERCEROS']).optional(),
        dias: z.number().min(0.1).optional(),
        conceptoId: z.number().optional(),
        costoUnitario: z.number().optional(),
        cantidadPersonas: z.number().optional(),
        montoNeto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
        solicitudPresupuestoId: z.preprocess(
          (value) =>
            value === null || value === undefined || value === ''
              ? undefined
              : Number(value),
          z.number().optional()
        ),
        liquidoPagable: z
          .number()
          .min(0.01, 'El monto debe ser mayor a 0')
          .optional(),
      })
    )
    .optional(),

  // Campos del Backend (Gastos)
  motivo: z.string().min(1, 'El motivo es requerido'),
  items: z
    .array(
      z.object({
        solicitudPresupuestoId: z.preprocess(
          (value) =>
            value === null || value === undefined || value === ''
              ? undefined
              : Number(value),
          z.number().optional()
        ),
        tipoDocumento: z.enum(['FACTURA', 'RECIBO']).optional(),
        tipoGastoId: z.number().optional(),
        montoNeto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
        cantidad: z
          .number()
          .min(1, 'La cantidad debe ser al menos 1')
          .optional(),
        costoUnitario: z
          .number()
          .min(0.01, 'El costo debe ser mayor a 0')
          .optional(),
        detalle: z.string().optional(),
        liquidoPagable: z
          .number()
          .min(0.01, 'El monto debe ser mayor a 0')
          .optional(),
      })
    )
    .optional(),

  // Tabla Hospedajes
  hospedajes: z
    .array(
      z.object({
        id: z.number().optional(),
        poaId: z.preprocess(
          (value) =>
            value === null || value === undefined || value === ''
              ? undefined
              : Number(value),
          z.number().min(1, 'Debes seleccionar una partida').optional()
        ),
        region: z.string().min(1, 'La región es requerida'),
        destino: z.string().min(1, 'El destino es requerido'),
        tipoDocumento: z.enum(['FACTURA', 'RECIBO']).default('RECIBO'),
        personas: z.number().min(1, 'Mínimo 1 persona'),
        noches: z.number().min(1, 'Mínimo 1 noche'),
        cantidadUnitaria: z.number().min(0.01, 'La tarifa debe ser mayor a 0'),
        costoTotal: z.number().min(0, 'El costo total debe ser válido'),
        iva: z.number().optional(),
        it: z.number().optional(),
      })
    )
    .optional(),

  // Nómina de Terceros (Paso 3)
  nomina: z
    .array(
      z.object({
        nombreCompleto: z.string().min(1, 'El nombre completo es requerido'),
        procedenciaInstitucion: z
          .string()
          .min(1, 'La procedencia/institución es requerida'),
        montoNeto: z
          .number()
          .min(0, 'Monto debe ser mayor o igual a 0')
          .optional(),
        liquidoPagable: z
          .number()
          .min(0, 'Monto debe ser mayor o igual a 0')
          .optional(),
      })
    )
    .optional(),

  // Confirmación Final
  destinatario: z.preprocess(
    (value) => (value === null || value === undefined ? '' : value),
    z.string().optional()
  ),

  // Respaldos
  urlCuadroComparativo: z
    .preprocess(
      (value) => (value === null || value === undefined ? '' : value),
      z.union([
        z.string().url('La URL del cuadro comparativo no es válida'),
        z.literal(''),
      ])
    )
    .optional(),
  urlCotizaciones: z
    .preprocess(
      (value) => {
        if (!Array.isArray(value)) {
          return [];
        }

        return value.map((item) =>
          item === null || item === undefined ? '' : item
        );
      },
      z.array(
        z.union([
          z.string().url('La URL de la cotización no es válida'),
          z.literal(''),
        ])
      )
    )
    .optional(),
});

export type FormData = z.infer<typeof formSchema>;

export type WizardStep = 'PLANIFICACION' | 'SOLICITUD' | 'RESPALDOS' | 'NOMINA';

export const defaultValues: FormData = {
  planificacionLugares: '',
  planificacionObjetivo: '',
  actividades: [
    {
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],
      cantDias: 1,
      actividadProgramada: '',
      cantInstitucion: 0,
      cantTerceros: 0,
    },
  ],
  interino: false,
  items: [],
  viaticos: [],
  hospedajes: [],
  proyecto: 'aaf',
  presupuestosIds: [],
  fuentesSeleccionadas: [],
  grupo: '',
  partida: '',
  codigoProyecto: '',
  solicitante: 'usuario',
  fechaInicio: '',
  fechaFin: '',
  motivo: '',
  nomina: [],
  destinatario: '',
  urlCuadroComparativo: '',
  urlCotizaciones: [''],
};
