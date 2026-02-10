/**
 * SIFIN API - Backend Types
 * Generated from backend-spec.json
 */

export type Role = 'ADMIN' | 'TESORERO' | 'USUARIO';

export interface Usuario {
  id: string;
  email: string;
  nombreCompleto: string;
  cargo?: string;
  rol: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: Usuario;
}

export interface CreateUsuarioDto {
  email: string;
  password: string;
  nombreCompleto: string;
  cargo?: string;
  rol: Role;
}

export interface UpdateUsuarioDto {
  email?: string;
  password?: string;
  nombreCompleto?: string;
  cargo?: string;
  rol?: Role;
}

export interface CreatePoaDto {
  codigoPoa: string;
  cantidad: number;
  costoUnitario: number;
  proyectoId: number;
  grupoId: number;
  partidaId: number;
  actividadId: number;
  codigoPresupuestarioId: number;
}

export interface Actividad extends EntityBase {
  detalleDescripcion?: string;
}

export interface Poa extends CreatePoaDto {
  id: number;
  costoTotal: number;
  saldoDisponible?: number | string;
  montoComprometido?: number | string;
  tieneCompromisos?: boolean;
  proyecto?: Proyecto;
  grupo?: GrupoContable;
  partida?: PartidaPresupuestaria;
  actividad?: Actividad;
  codigoPresupuestario?: CodigoPresupuestario;
  estructura?: {
    proyecto?: Proyecto;
    grupo?: GrupoContable;
    partida?: PartidaPresupuestaria;
  };
}

/** Datos de un SolicitudPresupuesto tal como vienen del Backend (GET /solicitudes/:id) */
export interface PresupuestoReserva {
  id: number;
  solicitudId?: number;
  poaId: number;
  poa?: Poa;
  montoPresupuestado: number;
  montoNeto: number;
}

/** Selección local de una partida POA — vive solo en React State hasta el onSubmit */
export interface SeleccionPresupuesto {
  id?: number; // ID de SolicitudPresupuesto si estamos editando, undefined si es nueva
  poaId: number;
  poa?: Poa; // Para display (nombre partida, proyecto, estructura)
  montoPresupuestado: number; // costoTotal del POA
  saldoDisponible: number; // saldoDisponible del POA
}

export type UpdatePoaDto = Partial<CreatePoaDto>;
export interface CreatePlanificacionDto {
  actividad: string;
  fechaInicio: string;
  fechaFin: string;
  cantInstitucional: number;
  cantTerceros: number;
}

export interface CreateViaticoDto {
  planificacionIndex: number;
  conceptoId: number;
  tipoDestino: 'INSTITUCIONAL' | 'TERCEROS';
  dias: number;
  cantidadPersonas: number;
  montoNeto: number;
  montoPresupuestado: number;
  solicitudPresupuestoId: number;
}

export interface CreateGastoDto {
  solicitudPresupuestoId: number;
  tipoGastoId: number;
  tipoDocumento: 'FACTURA' | 'RECIBO';
  cantidad: number;
  montoNeto: number;
  montoPresupuestado: number;
  detalle?: string;
}

export interface CreateNominaDto {
  nombreCompleto: string;
  procedenciaInstitucion: string;
}

export interface CreateSolicitudDto {
  presupuestosIds: number[];
  aprobadorId: number;
  lugarViaje: string;
  motivoViaje: string;
  descripcion?: string;
  planificaciones?: CreatePlanificacionDto[];
  viaticos?: CreateViaticoDto[];
  gastos?: CreateGastoDto[];
  nominasTerceros?: CreateNominaDto[];
}

export type UpdateSolicitudDto = Partial<CreateSolicitudDto>;

export interface Solicitud {
  id: number;
  presupuestos: PresupuestoReserva[];
  usuarioId: string;
  aprobadorId: number;
  codigo: string;
  lugarViaje: string;
  motivoViaje: string;
  descripcion?: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'OBSERVADO' | 'RECHAZADO' | 'DESEMBOLSADO';
  montoTotalNeto: number;
  montoTotalPresupuestado: number;
  createdAt: string;
  updatedAt: string;
  usuario?: Usuario;
  aprobador?: Usuario;
  planificaciones?: Record<string, unknown>[]; // Detailed schemas can be added later
  viaticos?: Record<string, unknown>[];
  gastos?: Record<string, unknown>[];
  nominasTerceros?: Record<string, unknown>[];
}

export interface AprobarSolicitudDto {
  nuevoAprobadorId: number;
}

export interface ObservarSolicitudDto {
  observacion: string;
}

export interface DesembolsarSolicitudDto {
  codigoDesembolso: string;
}

// Catalog types
export interface EntityBase {
  id: number;
  nombre: string;
  codigo?: string;
}

export type Proyecto = EntityBase;
export type GrupoContable = EntityBase;
export type PartidaPresupuestaria = EntityBase;
export type ConceptoViatico = EntityBase;
export type TipoGasto = EntityBase;
export type CodigoPresupuestario = EntityBase & {
  codigoCompleto?: string;
  descripcion?: string;
};
export type Banco = EntityBase;

export interface PoaStructureItem {
  id: number;
  codigoPoa: string;
  cantidad: number;
  costoUnitario: number | string;
  costoTotal: number | string;
  saldoDisponible?: number | string;
  montoComprometido?: number | string;
  tieneCompromisos?: boolean;
  actividad?: {
    id: number;
    detalleDescripcion: string;
  };
  estructura?: {
    proyecto?: Proyecto;
    grupo?: GrupoContable;
    partida?: PartidaPresupuestaria;
  };
  codigoPresupuestario?: CodigoPresupuestario;
}
