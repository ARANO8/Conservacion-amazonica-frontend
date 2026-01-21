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
        fechaInicio: z.string().min(1, 'Fecha inicio requerida'),
        fechaFin: z.string().min(1, 'Fecha fin requerida'),
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
  codigoPOA: z.string().optional(),
  grupo: z.union([z.string(), z.number()]).optional(),
  partida: z.union([z.string(), z.number()]).optional(),
  codigoProyecto: z.union([z.string(), z.number()]).optional(),
  solicitante: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),

  // Tabla 1: Viáticos / Pasajes
  viaticos: z
    .array(
      z.object({
        concepto: z.string().optional(),
        planificacionId: z.string().optional(),
        ciudad: z.string().optional(),
        destino: z.string().optional(),
        tipo: z.string().optional(),
        dias: z.number().optional(),
        personas: z.number().optional(),
        unitCost: z.number().optional(),
        amount: z.number().optional(),
        liquidoPagable: z.number().optional(),
      })
    )
    .optional(),

  // Campos del Backend (Gastos)
  motivo: z.string().min(1, 'El motivo es requerido'),
  items: z
    .array(
      z.object({
        groupId: z.union([z.string(), z.number()]).optional(),
        budgetLineId: z.union([z.string(), z.number()]).optional(),
        document: z.string().optional(),
        typeId: z.union([z.string(), z.number()]).optional(),
        amount: z.number().min(0, 'Monto inválido'),
        quantity: z.number().min(0).optional(),
        unitCost: z.number().min(0).optional(),
        description: z.string().optional(),
        financingSourceId: z.string().optional(),
        liquidoPagable: z.number().optional(),
      })
    )
    .min(1, 'Debes agregar al menos un ítem'),
  // Nómina de Terceros (Paso 3)
  nomina: z
    .array(
      z.object({
        nombreCompleto: z.string().min(1, 'El nombre completo es requerido'),
        institucion: z.string().min(1, 'La institución es requerida'),
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
  items: [
    {
      groupId: '',
      budgetLineId: '42858360-665d-4503-926b-dea2fba56e7a', // UUID válido por defecto
      document: 'Factura',
      typeId: '',
      quantity: 1,
      unitCost: 0,
      amount: 0,
      description: '',
      financingSourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // UUID válido por defecto
      liquidoPagable: 0,
    },
  ],
  viaticos: [
    {
      concepto: 'viaticos',
      planificacionId: '',
      ciudad: '',
      destino: '',
      tipo: 'institucional',
      dias: 1,
      personas: 1,
      unitCost: 0,
      amount: 0,
      liquidoPagable: 0,
    },
  ],
  proyecto: 'aaf',
  codigoPOA: '',
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
