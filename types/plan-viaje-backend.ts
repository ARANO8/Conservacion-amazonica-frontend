/**
 * Plan de Viaje (ANEXO 1). Documento previo a la solicitud de viaje, con VoBo
 * del Director de Programa. Refleja el modelo PlanViaje del backend.
 */

export type EstadoPlanViaje = 'BORRADOR' | 'ENVIADO' | 'OBSERVADO' | 'APROBADO';

export interface UsuarioResumen {
  id: number;
  nombreCompleto: string;
  email?: string;
  cargo?: string | null;
  rol?: string;
}

/** Una fila del cronograma del ANEXO 1 (modelo Planificacion). */
export interface ActividadPlanResponse {
  id: number;
  actividadProgramada: string;
  fechaInicio: string;
  fechaFin: string;
  /** Decimal serializado: días editables en medios días */
  diasCalculados: string | number;
  lugarSalida: string | null;
  lugarLlegada: string | null;
  cantidadPersonasInstitucional: number;
  cantidadPersonasTerceros: number;
  orden: number;
  participantesInstitucionales: {
    id: number;
    nombreCompleto: string;
    cargo?: string | null;
  }[];
}

export interface HistorialPlanViajeResponse {
  id: number;
  accion: string;
  comentario?: string | null;
  fecha: string;
  usuario?: UsuarioResumen | null;
}

export interface PlanViajeResponse {
  id: number;
  codigoPlan: string;
  cargo: string;
  lugaresViaje: string;
  objetivoViaje: string;
  lugarEmision: string;
  fechaEmision: string;
  estado: EstadoPlanViaje;
  observacion: string | null;
  usuarioId: number;
  directorProgramaId: number | null;
  fechaAprobacion: string | null;
  createdAt: string;
  updatedAt: string;
  usuario?: UsuarioResumen;
  directorPrograma?: UsuarioResumen | null;
  actividades: ActividadPlanResponse[];
  /** Solicitud de viaje que respalda (si fue eliminada, el plan está libre) */
  solicitud?: {
    id: number;
    codigoSolicitud: string;
    estado: string;
    deletedAt: string | null;
  } | null;
  historial?: HistorialPlanViajeResponse[];
}

export interface ActividadPlanPayload {
  /** Id de la fila existente al editar; sin id se crea una nueva */
  id?: number;
  actividadProgramada: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  lugarSalida: string;
  lugarLlegada: string;
  cantInstitucional: number;
  cantTerceros: number;
  participantesInstitucionalesIds: number[];
}

export interface PlanViajePayload {
  cargo?: string;
  lugaresViaje: string;
  objetivoViaje: string;
  lugarEmision?: string;
  fechaEmision: string;
  directorProgramaId?: number;
  actividades: ActividadPlanPayload[];
}
