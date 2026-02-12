import { z } from 'zod';

// Esquema Zod
export const formSchema = z.object({
  // Campos de Planificación (Paso 1)
  planificacionLugares: z
    .string()
    .min(1, 'Lugar/es del viaje y/o taller es/son requerido/s'),
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
  presupuestosIds: z
    .array(z.number())
    .min(1, 'Debes seleccionar al menos un presupuesto'),
  fuentesSeleccionadas: z
    .array(
      z.object({
        grupoId: z.union([z.string(), z.number()]).optional(),
        partidaId: z.union([z.string(), z.number()]).optional(),
        codigoPresupuestarioId: z.union([z.string(), z.number()]).optional(),
        poaId: z.number().nullable().optional(),
        poa: z.any().optional(), // Store the full POA for display/rehydration
        montoReservado: z.number().optional(),
        montoPresupuestado: z.number().optional(),
        saldoDisponible: z.number().optional(),
        isLocked: z.boolean().optional(),
      })
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
        planificacionIndex: z.number().optional(),
        ciudad: z.string().optional(),
        destino: z.string().optional(),
        tipoDestino: z.enum(['INSTITUCIONAL', 'TERCEROS']).optional(),
        dias: z.number().min(0.1).optional(),
        conceptoId: z.number().optional(),
        cantidadPersonas: z.number().optional(),
        montoNeto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
        solicitudPresupuestoId: z.number(),
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
        solicitudPresupuestoId: z.number(),
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
  // Nómina de Terceros (Paso 3)
  nomina: z
    .array(
      z.object({
        nombreCompleto: z.string().min(1, 'El nombre completo es requerido'),
        procedenciaInstitucion: z
          .string()
          .min(1, 'La procedencia/institución es requerida'),
        montoNeto: z.number().min(0.01, 'Monto debe ser mayor a 0').optional(),
        liquidoPagable: z
          .number()
          .min(0.01, 'Monto debe ser mayor a 0')
          .optional(),
      })
    )
    .optional(),

  // Confirmación Final
  destinatario: z.string().min(1, 'Debes seleccionar un destinatario'),
});

export type FormData = z.infer<typeof formSchema>;

export type WizardStep = 'PLANIFICACION' | 'SOLICITUD' | 'NOMINA';

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
};
