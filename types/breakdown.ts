export interface BreakdownItem {
  id: number;
  nombre: string; // Nombre del concepto/tipo de gasto
  detalle?: string; // Descripción adicional (ej: tipoDocumento para gastos, destino para viáticos)
  tipoDestino?: string; // Solo para viáticos (INSTITUCIONAL | TERCEROS)
  montoNeto: number; // Presupuestado
  montoLiquido: number; // A recibir
}

export interface PartidaGroup {
  reservaId: number;
  partidaNombre: string;
  actividadDescripcion?: string;
  esViatico: boolean;
  items: BreakdownItem[];
  totalLiquido: number;
  totalPresupuestado: number;
}
