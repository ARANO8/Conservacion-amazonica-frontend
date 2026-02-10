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
    dias?: number; // Valor decimal editado manualmente por el usuario
  }[];
  viaticos: {
    planificacionIndex: number;
    conceptoId: number;
    tipoDestino: string;
    dias: number;
    cantidadPersonas: number;
    montoNeto: number;
    montoPresupuestado: number;
    solicitudPresupuestoId: number;
  }[];
  gastos: {
    solicitudPresupuestoId: number;
    tipoGastoId: number;
    tipoDocumento: string;
    cantidad: number;
    montoNeto: number;
    montoPresupuestado: number;
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
  usuarioEmisorId?: number | string;
  usuarioId?: number | string;
  aprobadorId?: number;
  usuarioEmisor?: {
    id: number | string;
    nombreCompleto: string;
    email?: string;
    cargo?: string;
  };
  usuario?: {
    id: number | string;
    nombreCompleto: string;
    email: string;
  };
  aprobador?: {
    id: number | string;
    nombreCompleto: string;
    nombre?: string;
  };
  viaticos?: Array<{
    id: number;
    dias: number;
    cantidadPersonas: number;
    montoNeto: number | string;
    montoPresupuestado: number | string;
    tipoDestino: string;
    planificacionId?: number;
    concepto?: {
      id: number;
      nombre: string;
    };
    solicitudPresupuestoId: number;
    solicitudPresupuesto?: {
      poa?: { codigo: string };
    };
  }>;
  gastos?: Array<{
    id: number;
    cantidad: number;
    montoNeto: number | string;
    montoPresupuestado: number | string;
    detalle: string;
    tipoDocumento: string;
    planificacionId?: number;
    tipoGasto?: {
      id: number;
      nombre: string;
    };
    solicitudPresupuestoId: number;
    solicitudPresupuesto?: {
      poa?: { codigo: string };
    };
  }>;
  planificaciones?: Array<{
    id: number;
    actividadProgramada: string;
    fechaInicio: string;
    fechaFin: string;
    cantidadPersonasInstitucional: number;
    cantidadPersonasTerceros: number;
    diasCalculados?: number;
  }>;
  presupuestos?: Array<{
    id: number;
    poa?: {
      id: number;
      codigoPoa: string;
      nombre?: string;
      estructura?: {
        proyecto?: {
          id: number;
          nombre: string;
        };
        grupo?: {
          id: number;
          nombre: string;
        };
        partida?: {
          id: number;
          nombre: string;
        };
      };
      actividad?: {
        detalleDescripcion: string;
      };
    };
    viaticos?: Array<{
      id: number;
      dias: number;
      cantidadPersonas: number;
      montoNeto: number | string;
      montoPresupuestado: number | string;
      tipoDestino: string;
      concepto?: {
        id: number;
        nombre: string;
      };
    }>;
    gastos?: Array<{
      id: number;
      cantidad: number;
      montoNeto: number | string;
      montoPresupuestado: number | string;
      detalle: string;
      tipoDocumento: string;
      tipoGasto?: {
        id: number;
        nombre: string;
      };
    }>;
  }>;
  fechaInicio?: string;
  fechaFin?: string;
  lugarViaje?: string;
  codigoPoa?: string; // Fallback if direct
  personasExternas?: Array<{
    id: number;
    nombreCompleto: string;
    procedenciaInstitucion: string;
  }>;
}
