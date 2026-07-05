export interface Concepto {
  id: number;
  nombre: string;
  precioInstitucional?: string;
  precioTerceros?: string;
}

export interface Grupo {
  id: number;
  nombre: string;
}

export interface Partida {
  id: number;
  codigo: string;
  nombre: string;
  grupoId: number;
}

export interface TipoGasto {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  nombreCompleto: string;
  email?: string;
  rol?: string;
  cargo?: string;
}

export interface PoaLookup {
  codigo: string;
}

export interface Proyecto {
  id: number;
  nombre: string;
}

export interface CodigoPresupuestario {
  id: number;
  codigo?: string;
  descripcion?: string;
  codigoCompleto?: string;
}

export interface PartidaContable {
  id: number;
  codigo: string;
  nombre: string;
}
