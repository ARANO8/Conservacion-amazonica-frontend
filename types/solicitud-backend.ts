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
    ci: string;
  }[];
}
