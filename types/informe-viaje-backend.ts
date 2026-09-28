/**
 * ANEXO 7 — Informe de Viaje. Refleja el modelo InformeViaje del backend:
 * nace de una solicitud de viaje desembolsada (1:1) y lo revisa el Director
 * de Programa.
 */

export type EstadoInformeViaje =
  | 'BORRADOR'
  | 'ENVIADO'
  | 'OBSERVADO'
  | 'REVISADO';

export interface UsuarioResumenInforme {
  id: number;
  nombreCompleto: string;
  email?: string;
  cargo?: string | null;
  rol?: string;
}

export interface ActividadInformeResponse {
  id: number;
  informeId: number;
  orden: number;
  fecha: string; // ISO
  lugar: string;
  personaInstitucion: string;
  actividadesRealizadas: string;
}

export interface InformeViajeResponse {
  id: number;
  codigoInforme: string;
  motivoViaje: string;
  lugarViaje: string;
  fechaInicio: string;
  fechaFin: string;
  lugarEmision: string;
  fechaEmision: string;
  estado: EstadoInformeViaje;
  observacion: string | null;
  fechaRevision: string | null;
  usuarioId: number;
  directorProgramaId: number | null;
  solicitudId: number | null;
  createdAt: string;
  updatedAt: string;
  usuario?: UsuarioResumenInforme;
  directorPrograma?: UsuarioResumenInforme | null;
  actividades: ActividadInformeResponse[];
  solicitud?: {
    id: number;
    codigoSolicitud: string;
    estado: string;
    deletedAt: string | null;
  } | null;
}

/** Lo que el formulario precarga al elegir la solicitud. */
export interface PrecargaInforme {
  motivoViaje: string;
  lugarViaje: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  directorProgramaId: number | null;
  actividades: {
    fecha: string;
    lugar: string;
    personaInstitucion: string;
    actividadesRealizadas: string;
  }[];
}

export interface SolicitudInformable {
  id: number;
  codigoSolicitud: string;
  estado: string;
  directorPrograma: { id: number; nombreCompleto: string } | null;
  precarga: PrecargaInforme;
}

export interface InformeViajePayload {
  solicitudId?: number;
  motivoViaje: string;
  lugarViaje: string;
  lugarEmision: string;
  fechaEmision: string;
  directorProgramaId?: number;
  actividades: {
    fecha: string;
    lugar: string;
    personaInstitucion: string;
    actividadesRealizadas: string;
  }[];
}

/** Resumen del informe que la rendición muestra (o su ausencia). */
export interface InformeViajeResumen {
  id: number;
  codigoInforme: string;
  estado: EstadoInformeViaje;
  deletedAt: string | null;
}
