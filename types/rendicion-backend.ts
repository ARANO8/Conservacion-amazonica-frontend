/**
 * Backend Response Types for Rendiciones (Accountability Reports)
 * These types match the API responses from the backend rendiciones endpoints.
 */

import type { SolicitudResponse } from './solicitud-backend';

// ---------------------------------------------------------------------------
// Enums (from backend)
// ---------------------------------------------------------------------------

export enum EstadoRendicion {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  OBSERVADA = 'OBSERVADA',
  RECHAZADA = 'RECHAZADA',
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
}

// ---------------------------------------------------------------------------
// Gasto Rendición (Expense with Supporting Document)
// ---------------------------------------------------------------------------

export interface GastoRendicionResponse {
  id: number;
  rendicionId: number;
  concepto: string;
  detalle?: string;
  tipoDocumento: TipoDocumentoGasto;
  numeroDocumento?: string;
  proveedor?: string;
  fechaDocumento?: string; // ISO date
  montoTotal: string; // Decimal as string from backend
  montoNeto: string; // Decimal as string
  estado: EstadoGastoRendicion;
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
  // Backend names (from Prisma model)
  nroDocumento?: string;
}

// ---------------------------------------------------------------------------
// Declaración Jurada (Sworn Statement)
// ---------------------------------------------------------------------------

export interface DeclaracionJuradaResponse {
  id: number;
  rendicionId: number;
  tipoDeclaracion: 'COMPLETA' | 'PARCIAL' | 'NEGATIVA';
  confirmaDatosVeridicos: boolean;
  aceptaPoliticaDevolucion: boolean;
  montoADevolver?: string; // Decimal as string
  observaciones?: string;
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

// ---------------------------------------------------------------------------
// Main Rendición Response
// ---------------------------------------------------------------------------

export interface RendicionResponse {
  id: number;
  solicitudId: number;
  fechaRendicion: string; // ISO date or DateTime
  montoRespaldado: string; // Decimal as string (sum of gastos montoTotal)
  saldoLiquido: string; // Decimal as string (desembolso - montoRespaldado)
  estado: EstadoRendicion;
  observaciones?: string;
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp

  // Relations
  solicitud: SolicitudResponse;
  gastosRendicion: GastoRendicionResponse[];
  declaracionesJuradas: DeclaracionJuradaResponse[];

  // Legacy aliases for convenience (not from backend, added by frontend)
  gastos?: GastoRendicionResponse[];
  gastosSinRespaldo?: never;
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
