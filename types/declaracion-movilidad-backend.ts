/**
 * Tipos del módulo Declaración Jurada de Movilidad (ANEXO 6).
 * Corresponden a los modelos DeclaracionMovilidad / DetalleMovilidad en Prisma.
 */

export interface DetalleMovilidadResponse {
  id: number;
  declaracionId: number;
  orden: number;
  fecha: string; // ISO date
  origen: string;
  destino: string;
  motivo: string;
  /** Columna auxiliar: sólo se usa para repoblar el formulario al editar. */
  montoGastado: string; // Decimal serializado
  monto: string; // Decimal serializado
}

export interface DeclaracionMovilidadResponse {
  id: number;
  codigoDeclaracion: string;
  cargo: string;
  motivoActividad: string;
  proyectoPartida: string;
  lugarEmision: string;
  fechaEmision: string; // ISO date
  totalBruto: string; // Decimal serializado
  retencion: string;
  totalLiquido: string;
  usuarioId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  usuario?: {
    id: number;
    nombreCompleto: string;
    email?: string;
    cargo?: string | null;
  };
  detalles: DetalleMovilidadResponse[];
}

export interface CreateDeclaracionMovilidadPayload {
  cargo: string;
  motivoActividad: string;
  proyectoPartida: string;
  lugarEmision: string;
  fechaEmision: string; // ISO
  detalles: {
    fecha: string; // ISO
    origen: string;
    destino: string;
    motivo: string;
    montoGastado: number;
  }[];
}
