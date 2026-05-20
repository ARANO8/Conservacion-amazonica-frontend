export interface OrdenCompraItemPayload {
  orden: number;
  item: string;
  cantidad: number;
  unidad?: string;
  detalle?: string;
  precioUnitario: number;
  cuadroItemId?: number;
  sinCuadro?: boolean;
}

export interface CreateOrdenCompraPayload {
  cuadroComparativoId?: number;
  proveedorNombre: string;
  proveedorDireccion?: string;
  proveedorTelefono?: string;
  lugarEntrega?: string;
  formaPago?: string;
  garantia?: string;
  observaciones?: string;
  items: OrdenCompraItemPayload[];
}

export interface OrdenCompraItemResponse {
  id: number;
  orden: number;
  item: string;
  cantidad: string;
  unidad: string | null;
  detalle: string | null;
  precioUnitario: string;
  total: string;
  sinCuadro: boolean;
  cuadroItemId: number | null;
  cuadroItem?: {
    id: number;
    descripcion: string;
    cuadroId: number;
  } | null;
}

export interface OrdenCompraResponse {
  id: number;
  codigoOrden: string;
  fecha: string;
  proveedorNombre: string;
  proveedorDireccion: string | null;
  proveedorTelefono: string | null;
  lugarEntrega: string | null;
  formaPago: string;
  garantia: string;
  observaciones: string | null;
  total: string;
  createdAt: string;
  updatedAt: string;
  cuadroComparativoId: number | null;
  usuarioEmisorId: number;
  usuarioEmisor?: {
    id: number;
    nombreCompleto: string;
    email?: string;
    cargo?: string | null;
  };
  cuadroComparativo?: {
    id: number;
    codigoCuadro: string;
  } | null;
  items: OrdenCompraItemResponse[];
}

export interface PrefillOrdenCompraResponse {
  cuadroComparativoId: number;
  cuadroCodigoCuadro: string;
  proveedorNombre: string;
  proveedorDireccion: string;
  proveedorTelefono: string;
  garantia: string;
  formaPago: string;
  items: {
    orden: number;
    item: string;
    cantidad: number;
    unidad: string;
    detalle: string;
    precioUnitario: number;
    total: number;
    cuadroItemId: number;
    sinCuadro: boolean;
  }[];
}
