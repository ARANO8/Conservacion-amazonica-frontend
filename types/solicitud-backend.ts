export interface CreateSolicitudPayload {
  presupuestosIds: number[];
  aprobadorId: number;
  lugarViaje: string;
  motivoViaje: string;
  descripcion: string;
  planificaciones: {
    actividad: string;
    fechaInicio: string; // ISO String
    fechaFin: string; // ISO String
    cantInstitucional: number;
    cantTerceros: number;
  }[];
  viaticos: {
    planificacionIndex: number;
    conceptoId: number;
    tipoDestino: string;
    dias: number;
    cantidadPersonas: number;
    montoNeto: number;
    solicitudPresupuestoId: number;
  }[];
  gastos: {
    solicitudPresupuestoId: number;
    tipoGastoId: number;
    tipoDocumento: string;
    cantidad: number;
    montoNeto: number;
    detalle: string;
  }[];
  nominasTerceros: {
    nombreCompleto: string;
    procedenciaInstitucion: string;
  }[];
}

export interface SolicitudResponse {
  id: number;
  codigoSolicitud: string;
  motivoViaje: string;
  fechaSolicitud: string;
  descripcion: string;
  fechaCreacion: string; // ISO String
  estado: string;
  montoTotalNeto: string;
  montoTotalPresupuestado: string;
  usuarioEmisor?: {
    nombreCompleto: string;
    email?: string;
  };
  usuario?: {
    nombreCompleto: string;
    email: string;
  };
  viaticos?: Array<{
    montoNeto: number | string;
    solicitudPresupuesto?: {
      poa?: { codigo: string };
    };
  }>;
  gastos?: Array<{
    montoNeto: number | string;
    solicitudPresupuesto?: {
      poa?: { codigo: string };
    };
  }>;
  codigoPoa?: string; // Fallback if direct
}
