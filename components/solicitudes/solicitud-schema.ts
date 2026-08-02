import { z } from 'zod';

const proyectoSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  cuentaBancaria: z
    .object({
      id: z.coerce.number().optional().nullable(),
      nombre: z.string().optional().nullable(),
      numeroCuenta: z.string().optional().nullable(),
      banco: z.string().optional().nullable(),
      moneda: z.string().optional().nullable(),
      tipoCuenta: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
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
  id: z.coerce.number(),
  codigoPoa: z.string(),
  cantidad: z.coerce.number().optional(),
  costoUnitario: z.coerce.number().optional(),
  costoTotal: z.coerce.number().optional(),
  saldoDisponible: z.coerce.number().optional(),
  montoComprometido: z.coerce.number().optional(),
  tieneCompromisos: z.boolean().optional(),
  proyectoId: z.coerce.number().optional(),
  grupoId: z.coerce.number().optional(),
  partidaId: z.coerce.number().optional(),
  actividadId: z.coerce.number().optional(),
  codigoPresupuestarioId: z.coerce.number().optional(),
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
        cantDias: z.preprocess(
          (v) => (v === null ? undefined : v),
          z
            .number({ required_error: 'Días es requerido' })
            .min(0.5, 'Mínimo 0.5 días')
        ),
        actividadProgramada: z.string().min(1, 'Actividad requerida'),
        cantInstitucion: z.preprocess(
          (v) => (v === null ? undefined : v),
          z
            .number({ required_error: 'Pers. Inst. es requerido' })
            .min(1, 'Debe haber al menos 1 persona institucional')
        ),
        cantTerceros: z.preprocess(
          (v) => (v === null ? undefined : v),
          z.number().min(0).max(50, 'Máximo 50 terceros por actividad')
        ),
        // Nómina de terceros de esta actividad (Paso 4). Se autogenera a
        // partir de cantTerceros y se mantiene anidada para que sobreviva a
        // reordenamientos y eliminaciones de actividades.
        terceros: z
          .array(
            z.object({
              nombreCompleto: z
                .string()
                .min(1, 'El nombre completo es requerido'),
              procedenciaInstitucion: z
                .string()
                .min(1, 'La procedencia/institución es requerida'),
            })
          )
          .default([]),
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
        id: z.coerce.number().optional(),
        planificacionIndexes: z.array(z.number()).default([]).optional(),
        ciudad: z.string().optional(),
        destino: z.string().optional(),
        tipoDestino: z.enum(['INSTITUCIONAL', 'TERCEROS']).optional(),
        dias: z.coerce.number().min(0.1).optional(),
        conceptoId: z.coerce.number().optional(),
        costoUnitario: z.coerce.number().optional(),
        cantidadPersonas: z.coerce.number().optional(),
        montoNeto: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
        solicitudPresupuestoId: z.preprocess(
          (value) =>
            value === null || value === undefined || value === ''
              ? undefined
              : Number(value),
          z.number().optional()
        ),
        liquidoPagable: z.coerce
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
        cantidad: z.preprocess(
          (v) => (v === null ? undefined : v),
          z.number().min(1, 'La cantidad debe ser al menos 1').optional()
        ),
        costoUnitario: z.preprocess(
          (v) => (v === null ? undefined : v),
          z.number().min(0.01, 'El costo debe ser mayor a 0').optional()
        ),
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
        id: z.coerce.number().optional(),
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
        personas: z.preprocess(
          (v) => (v === null ? undefined : v),
          z.coerce.number().min(1, 'Mínimo 1 persona')
        ),
        noches: z.preprocess(
          (v) => (v === null ? undefined : v),
          z.coerce.number().min(1, 'Mínimo 1 noche')
        ),
        cantidadUnitaria: z.coerce
          .number()
          .min(0.01, 'La tarifa debe ser mayor a 0'),
        costoTotal: z.coerce.number().min(0, 'El costo total debe ser válido'),
        iva: z.coerce.number().optional(),
        it: z.coerce.number().optional(),
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
      cantInstitucion: 1,
      cantTerceros: 0,
      terceros: [],
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
  destinatario: '',
  urlCuadroComparativo: '',
  urlCotizaciones: [''],
};
