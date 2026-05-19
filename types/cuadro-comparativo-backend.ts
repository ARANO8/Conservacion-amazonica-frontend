export interface CuadroPrecioPayload {
  cotizacionIndex: number;
  precioUnitario?: number;
  noMenciona?: boolean;
}

export interface CuadroItemPayload {
  orden: number;
  descripcion: string;
  cantidad: number;
  unidad?: string;
  ganadoraCotizacionIndex?: number;
  precios: CuadroPrecioPayload[];
}

export interface CuadroCotizacionPayload {
  orden: number;
  cotizacionId: number;
}

export interface CreateCuadroComparativoPayload {
  lugarFecha?: string;
  observaciones?: string;
  recomendadaCotizacionIndex?: number;
  cotizaciones: CuadroCotizacionPayload[];
  items: CuadroItemPayload[];
}

export interface CuadroPrecioResponse {
  id: number;
  precioUnitario: string | null;
  total: string | null;
  noMenciona: boolean;
  cuadroItemId: number;
  cuadroCotizacionId: number;
}

export interface CuadroCotizacionResponse {
  id: number;
  orden: number;
  proveedorNombre: string;
  total: string;
  cotizacionId: number;
  cotizacion?: { id: number; codigoCotizacion: string };
}

export interface CuadroItemResponse {
  id: number;
  orden: number;
  descripcion: string;
  cantidad: string;
  unidad: string | null;
  cotizacionGanadoraId: number | null;
  precios: CuadroPrecioResponse[];
}

export interface CuadroComparativoResponse {
  id: number;
  codigoCuadro: string;
  lugarFecha: string | null;
  observaciones: string | null;
  estado: string;
  totalRecomendado: string | null;
  motivoObservacion: string | null;
  cotizacionRecomendadaId: number | null;
  createdAt: string;
  updatedAt: string;
  usuarioEmisorId: number;
  usuarioEmisor?: {
    id: number;
    nombreCompleto: string;
    email?: string;
    cargo?: string | null;
  };
  cotizaciones: CuadroCotizacionResponse[];
  items: CuadroItemResponse[];
  historialAprobaciones?: {
    id: number;
    accion: string;
    comentario: string | null;
    fecha: string;
    usuario?: { id: number; nombreCompleto: string; cargo?: string | null };
  }[];
}
