export interface CreateLineaCotizacionPayload {
  cantidad: number;
  unidad?: string;
  detalle: string;
  precioUnitario: number;
}

export type TipoCotizacion = 'PROPIA' | 'EXTERNA';

export interface CreateCotizacionPayload {
  fecha?: string;
  tipo?: TipoCotizacion;
  proveedorNombre: string;
  proveedorTelefono?: string;
  proveedorDireccion?: string;
  proveedorCorreo?: string;
  garantia?: string;
  disponibilidad?: string;
  duracionCotizacion?: string;
  emiteFactura?: boolean;
  observaciones?: string;
  adjuntoUrl?: string;
  lineas: CreateLineaCotizacionPayload[];
}

export interface LineaCotizacionResponse {
  id: number;
  cantidad: string;
  unidad: string | null;
  detalle: string;
  precioUnitario: string;
  total: string;
  cotizacionId: number;
}

export interface CotizacionResponse {
  id: number;
  codigoCotizacion: string;
  fecha: string;
  tipo: TipoCotizacion;
  proveedorNombre: string;
  proveedorTelefono: string | null;
  proveedorDireccion: string | null;
  proveedorCorreo: string | null;
  garantia: string | null;
  disponibilidad: string | null;
  duracionCotizacion: string | null;
  emiteFactura: boolean;
  observaciones: string | null;
  adjuntoUrl: string | null;
  total: string;
  createdAt: string;
  updatedAt: string;
  usuarioEmisorId: number;
  usuarioEmisor?: {
    id: number;
    nombreCompleto: string;
    email?: string;
    cargo?: string | null;
  };
  lineas: LineaCotizacionResponse[];
}
