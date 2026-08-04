export type TipoSolicitud = 'VIAJE' | 'COMPRA_SERVICIO';

export type EstadoPagoParcial =
  | 'PLANIFICADO'
  | 'SOLICITADO'
  | 'OBSERVADO'
  | 'APROBADO'
  | 'PAGADO';

export interface PagoParcialResponse {
  id: number;
  numero: number;
  monto: number | string;
  fechaPago: string;
  descripcion?: string | null;
  estado: EstadoPagoParcial;
  urlComprobante?: string | null;
  urlInforme?: string | null;
  fechaPagoReal?: string | null;
  /** Motivo de la última devolución a Adquisiciones */
  observacion?: string | null;
  solicitadoPorId?: number | null;
  aprobadorId?: number | null;
  pagadoPorId?: number | null;
}

export interface GastoCompraResponse {
  id: number;
  cantidad: number | string;
  descripcion: string;
  uso?: string | null;
  costoUnitario: number | string;
  total: number | string;
  solicitudPresupuestoId: number;
  tipoDocumento?: 'FACTURA' | 'RECIBO';
  montoPresupuestado?: number | string;
  iva?: number | string;
  it?: number | string;
  pagos?: PagoParcialResponse[];
  solicitudPresupuesto?: {
    poa?: {
      estructura?: { partida?: { id: number; nombre: string } };
    };
  };
}

export interface CreateSolicitudCompraPayload {
  poaIds: number[];
  /** No aplica a consultorías: nacen en ejecución y se aprueba cada cuota */
  aprobadorId?: number;
  tipo: 'COMPRA_SERVICIO';
  proyecto?: string;
  motivoViaje: string;
  chequeANombreDe?: string;
  descripcion?: string;
  gastosCompra: {
    cantidad: number;
    descripcion: string;
    uso?: string;
    costoUnitario: number;
    poaId: number;
    tipoDocumento?: 'FACTURA' | 'RECIBO';
    pagos?: { monto: number; fechaPago: string; descripcion?: string }[];
  }[];
  planificaciones: [];
  viaticos: [];
  gastos: [];
  nominasTerceros: [];
  hospedajes: [];
}

export interface CreateSolicitudPayload {
  poaIds: number[];
  aprobadorId: number;
  lugarViaje: string;
  motivoViaje: string;
  descripcion: string;
  urlCuadroComparativo?: string;
  urlCotizaciones?: string[];
  planificaciones: {
    actividad: string;
    fechaInicio: string; // ISO String
    fechaFin: string; // ISO String
    cantInstitucional: number;
    cantTerceros: number;
    dias?: number; // Valor decimal editado manualmente por el usuario
  }[];
  viaticos: {
    planificacionIndexes: number[];
    conceptoId: number;
    tipoDestino: string;
    dias: number;
    cantidadPersonas: number;
    montoNeto: number;
    montoPresupuestado: number;
    poaId: number;
  }[];
  gastos: {
    poaId: number;
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
    planificacionIndex?: number;
  }[];
  hospedajes: {
    poaId: number;
    region: string;
    destino: string;
    tipoDocumento: string;
    personas: number;
    noches: number;
    cantidadUnitaria: number;
    costoTotal: number;
    iva: number;
    it: number;
  }[];
}

export interface HistorialUsuarioResumen {
  id: number;
  nombreCompleto: string;
  rol?: string;
  cargo?: string;
}

export interface HistorialAprobacionSolicitudResponse {
  id: number;
  accion: 'CREADO' | 'APROBADO' | 'OBSERVADO' | 'DERIVADO' | 'RECHAZADO';
  comentario?: string | null;
  fecha: string;
  usuarioId: number;
  derivadoAId?: number | null;
  solicitudId?: number | null;
  rendicionId?: number | null;
  usuario?: HistorialUsuarioResumen;
  derivadoA?: HistorialUsuarioResumen | null;
}

export interface SolicitudResponse {
  id: number;
  codigoSolicitud: string;
  tipo?: TipoSolicitud;
  proyecto?: string | null;
  chequeANombreDe?: string | null;
  banco?: string | null;
  fechaDesembolso?: string | null;
  motivoViaje?: string | null;
  fechaSolicitud: string;
  descripcion?: string | null;
  urlCuadroComparativo?: string;
  urlCotizaciones?: string[];
  fechaCreacion: string; // ISO String
  estado: string;
  /** Motivo con el que el revisor devolvió la solicitud (distinto de `descripcion`) */
  observacion?: string | null;
  montoTotalNeto: string;
  montoTotalPresupuestado: string;
  usuarioEmisorId?: number | string;
  usuarioId?: number | string;
  aprobadorId?: number;
  aprobadorActualId?: number | string;
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
    costoUnitario?: number | string;
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
    costoUnitario?: number | string;
  }>;
  planificaciones?: Array<{
    id: number;
    actividadProgramada: string;
    fechaInicio: string;
    fechaFin: string;
    cantidadPersonasInstitucional: number;
    cantidadPersonasTerceros: number;
    diasCalculados?: number;
    dias?: number; // Propiedad que el backend envía con el valor decimal real
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
          cuentaBancaria?: import('@/types/backend').CuentaBancaria;
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
      montoPresupuestado?: number | string;
      saldoDisponible?: number | string;
      costoTotal?: number | string;
    };
    viaticos?: Array<{
      id: number;
      dias: number;
      cantidadPersonas: number;
      montoNeto: number | string;
      montoPresupuestado: number | string;
      costoUnitario?: number | string;
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
    hospedajes?: Array<{
      id: number;
      region: string;
      destino: string;
      tipoDocumento?: string;
      personas: number;
      noches: number;
      cantidadUnitaria: number | string;
      costoTotal: number | string;
      iva: number | string;
      it: number | string;
    }>;
    subtotalPresupuestado?: number | string;
  }>;
  fechaInicio?: string;
  fechaFin?: string;
  lugarViaje?: string;
  codigoPoa?: string; // Fallback if direct
  hospedajes?: Array<{
    id: number;
    region: string;
    destino: string;
    tipoDocumento?: string;
    personas: number;
    noches: number;
    cantidadUnitaria: number | string;
    costoTotal: number | string;
    iva: number | string;
    it: number | string;
    poaId?: number;
  }>;
  personasExternas?: Array<{
    id: number;
    nombreCompleto: string;
    procedenciaInstitucion: string;
    planificacionId?: number | null;
  }>;
  codigoDesembolso?: string;
  urlComprobante?: string;
  gastosCompra?: GastoCompraResponse[];
  historialAprobaciones?: HistorialAprobacionSolicitudResponse[];
  rendicion?: {
    id: number;
    estado: string;
  };
}
