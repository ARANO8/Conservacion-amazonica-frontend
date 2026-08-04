/**
 * Backend Response Types for Rendiciones (Accountability Reports)
 * These types match the API responses from the backend rendiciones endpoints.
 */

import type { SolicitudResponse } from './solicitud-backend';
import type { PartidaContable } from './catalogs';

// ---------------------------------------------------------------------------
// Enums (from backend)
// ---------------------------------------------------------------------------

export enum EstadoRendicion {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  OBSERVADO = 'OBSERVADO',
  RECHAZADO = 'RECHAZADO',
  APROBADA = 'APROBADA',
  OBSERVADA = 'OBSERVADA',
  RECHAZADA = 'RECHAZADA',
}

export enum TipoAccionHistorial {
  CREADO = 'CREADO',
  APROBADO = 'APROBADO',
  OBSERVADO = 'OBSERVADO',
  DERIVADO = 'DERIVADO',
  RECHAZADO = 'RECHAZADO',
}

export interface HistorialUsuario {
  id: number;
  nombreCompleto: string;
  rol?: string;
  cargo?: string;
}

export interface HistorialAprobacionResponse {
  id: number;
  accion: TipoAccionHistorial;
  comentario?: string | null;
  fecha: string;
  usuarioId: number;
  derivadoAId?: number | null;
  solicitudId?: number | null;
  rendicionId?: number | null;
  usuario?: HistorialUsuario;
  derivadoA?: HistorialUsuario | null;
}

export enum EstadoGastoRendicion {
  PENDIENTE = 'PENDIENTE',
  COMPROBADO = 'COMPROBADO',
  RECHAZADO = 'RECHAZADO',
}

export enum TipoDocumentoGasto {
  FACTURA = 'FACTURA',
  RECIBO = 'RECIBO',
  BOLETA = 'BOLETA',
  LV = 'LV',
  DJ = 'DJ',
  PPT = 'PPT',
  PAT = 'PAT',
  PVT = 'PVT',
}

// ---------------------------------------------------------------------------
// Gasto Rendición (Expense with Supporting Document)
// ---------------------------------------------------------------------------

export interface GastoRendicionResponse {
  id: number;
  rendicionId: number;
  concepto?: string;
  detalle?: string;
  tipoDocumento: TipoDocumentoGasto;
  numeroDocumento?: string;
  proveedor?: string;
  fechaDocumento?: string; // ISO date
  montoTotal?: string; // Decimal as string from backend
  montoNeto?: string; // Decimal as string
  estado?: EstadoGastoRendicion;
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
  // Backend names (from Prisma model actual)
  nroDocumento?: string;
  fecha?: string;
  monto?: string;
  montoBruto?: string;
  montoImpuestos?: string;
  partidaId?: number;
  tipoRetencion?: string;
  partidaContableId?: number | null;
  partidaContable?: PartidaContable | null;
  partida?: {
    id: number;
    poa?: {
      codigoPoa?: string;
      estructura?: {
        partida?: {
          id: number;
          nombre: string;
        };
        proyecto?: {
          id: number;
          nombre: string;
        };
        grupo?: {
          id: number;
          nombre: string;
        };
      };
    };
  };
}

// ---------------------------------------------------------------------------
// Main Rendición Response
// ---------------------------------------------------------------------------

export interface RendicionResponse {
  id: number;
  solicitudId: number;
  aprobadorActualId?: number | null;
  fechaRendicion: string; // ISO date or DateTime
  montoRespaldado: string; // Decimal as string (sum of gastos montoTotal)
  saldoLiquido: string; // Decimal as string (desembolso - montoRespaldado)
  estado: EstadoRendicion;
  observaciones?: string;
  comprobanteUrl?: string;
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp

  // Relations
  solicitud: SolicitudResponse;
  aprobadorActual?: HistorialUsuario | null;
  gastosRendicion: GastoRendicionResponse[];
  /** Gastos menores sin comprobante; cuentan como egreso y no retienen */
  declaracionesJuradas?: {
    id: number;
    fecha: string;
    detalle: string;
    monto: string;
  }[];
  historialAprobaciones?: HistorialAprobacionResponse[];

  // Legacy aliases for convenience (not from backend, added by frontend)
  gastos?: GastoRendicionResponse[];
}

// ---------------------------------------------------------------------------
// List Response
// ---------------------------------------------------------------------------

export interface RendicionListResponse {
  data: RendicionResponse[];
  total: number;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Summary/Card View
// ---------------------------------------------------------------------------

export interface RendicionSummary {
  id: number;
  fechaRendicion: string;
  estado: EstadoRendicion;
  montoRespaldado: string;
  saldoLiquido: string;
  gastosCount: number;
}
