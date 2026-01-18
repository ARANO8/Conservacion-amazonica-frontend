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
}

export interface CreateGastoDto {
  grupoId: number;
  partidaId: number;
  tipoGastoId: number;
  tipoDocumento: 'FACTURA' | 'RECIBO';
  cantidad: number;
  costoUnitario: number;
  detalle?: string;
}

export interface CreateNominaDto {
  nombreCompleto: string;
  ci: string;
}

export interface CreateSolicitudDto {
  poaId: number;
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
  poaId: number;
  usuarioId: string;
  aprobadorId: number;
  codigo: string;
  lugarViaje: string;
  motivoViaje: string;
  descripcion?: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'OBSERVADO' | 'RECHAZADO' | 'DESEMBOLSADO';
  totalMonto: number;
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
export type CodigoPresupuestario = EntityBase;
export type Banco = EntityBase;
