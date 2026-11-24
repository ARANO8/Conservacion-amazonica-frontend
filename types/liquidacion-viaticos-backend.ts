/**
 * ANEXO 5 — Liquidación de Viáticos. Refleja el modelo LiquidacionViaticos del
 * backend: nace de una solicitud de viaje desembolsada (1:1), lleva una hoja
 * por persona institucional y la revisa el Director de Programa.
 *
 * Los montos llegan como string (Prisma.Decimal serializado).
 */

export type EstadoLiquidacionViaticos =
  | 'BORRADOR'
  | 'ENVIADO'
  | 'OBSERVADO'
  | 'REVISADO';

export interface UsuarioResumenLiquidacion {
  id: number;
  nombreCompleto: string;
  email?: string;
  cargo?: string | null;
  rol?: string;
}

export interface FilaLiquidacionResponse {
  id: number;
  orden: number;
  conceptoId: number;
  porcentaje: number;
  dias: string;
  tarifaLiquida: string;
  totalLiquido: string;
  totalBruto: string;
  solicitudPresupuestoId: number | null;
  concepto: { id: number; nombre: string };
}

export interface HojaLiquidacionResponse {
  id: number;
  orden: number;
  usuarioId: number;
  cargo: string;
  ci: string;
  sede: string;
  via: string;
  escala: string;
  motivoViaje: string;
  destino: string;
  fechaSalida: string;
  fechaRetorno: string;
  totalLiquido: string;
  totalBruto: string;
  rcIva: string;
  usuario: { id: number; nombreCompleto: string };
  filas: FilaLiquidacionResponse[];
}

export interface LiquidacionViaticosResponse {
  id: number;
  codigoLiquidacion: string;
  lugarEmision: string;
  fechaEmision: string;
  estado: EstadoLiquidacionViaticos;
  observacion: string | null;
  fechaRevision: string | null;
  usuarioId: number;
  directorProgramaId: number | null;
  solicitudId: number | null;
  createdAt: string;
  updatedAt: string;
  usuario?: UsuarioResumenLiquidacion;
  directorPrograma?: UsuarioResumenLiquidacion | null;
  hojas: HojaLiquidacionResponse[];
  solicitud?: {
    id: number;
    codigoSolicitud: string;
    estado: string;
    deletedAt: string | null;
  } | null;
}

/** Una hoja ya calculada con las tarifas vigentes, para precargar el formulario. */
export interface HojaPrecargada {
  usuario: {
    id: number;
    nombreCompleto: string;
    cargo: string | null;
    ci: string | null;
  };
  cargo: string;
  ci: string;
  sede: string;
  via: string;
  escala: string;
  motivoViaje: string;
  destino: string;
  fechaSalida: string | null;
  fechaRetorno: string | null;
  filas: {
    conceptoId: number;
    nombreConcepto: string;
    porcentaje: number;
    dias: number;
    solicitudPresupuestoId: number;
    tarifaLiquida: string;
    totalLiquido: string;
    totalBruto: string;
  }[];
  totalLiquido: string;
  totalBruto: string;
  rcIva: string;
}

export interface SolicitudLiquidable {
  id: number;
  codigoSolicitud: string;
  estado: string;
  directorProgramaId: number | null;
  partidaPorDefecto: number | null;
  /** Viáticos institucionales presupuestados (líquido), para advertir excesos */
  presupuestadoLiquido: string;
  hojas: HojaPrecargada[];
}

export interface LiquidacionViaticosPayload {
  solicitudId?: number;
  lugarEmision?: string;
  fechaEmision: string;
  directorProgramaId?: number;
  hojas: {
    usuarioId: number;
    cargo: string;
    ci?: string;
    sede?: string;
    via?: string;
    escala?: string;
    motivoViaje: string;
    destino: string;
    fechaSalida: string;
    fechaRetorno: string;
    filas: {
      conceptoId: number;
      porcentaje: number;
      dias: number;
      solicitudPresupuestoId?: number;
    }[];
  }[];
}

/** Gasto LV listo para el wizard de la rendición. */
export interface GastoLv {
  hojaLiquidacionId: number;
  concepto: string;
  detalle: string;
  tipoDocumento: 'LV';
  numeroDocumento: string;
  proveedor: string;
  fechaDocumento: string;
  partidaId: number;
  montoBruto: number;
  montoImpuestos: number;
  montoNeto: number;
}

export interface GastosLvResponse {
  /** null si la solicitud aún no tiene liquidación */
  estado: EstadoLiquidacionViaticos | null;
  gastos: GastoLv[];
}

/** Resumen de la liquidación que trae la solicitud (o su ausencia). */
export interface LiquidacionViaticosResumen {
  id: number;
  codigoLiquidacion: string;
  estado: EstadoLiquidacionViaticos;
  deletedAt: string | null;
}
