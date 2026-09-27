/**
 * Tipos del módulo Informe de Viaje (ANEXO 7).
 * Corresponden al modelo InformeViaje en Prisma del backend.
 */

export interface ActividadInformeResponse {
  id: number;
  informeId: number;
  fecha: string; // ISO date
  lugar: string;
  personaInstitucion: string;
  actividadesRealizadas: string;
}

export interface InformeViajeResponse {
  id: number;
  codigoInforme: string;
  fechaInicio: string; // ISO date
  fechaFin: string; // ISO date
  usuarioId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  usuario?: {
    id: number;
    nombreCompleto: string;
    email?: string;
    cargo?: string | null;
  };
  actividades: ActividadInformeResponse[];
}

export interface CreateInformeViajePayload {
  fechaInicio: string; // ISO
  fechaFin: string; // ISO
  actividades: {
    fecha: string; // ISO
    lugar: string;
    personaInstitucion: string;
    actividadesRealizadas: string;
  }[];
}
