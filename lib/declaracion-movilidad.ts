/**
 * ANEXO 6 — cálculo de la Declaración Jurada de Movilidad.
 *
 * Espejo de `declaraciones-movilidad.helper.ts` del backend: sirve para pintar
 * los montos y el pie de la grilla en vivo mientras se llena el formulario.
 * El servidor recalcula todo al guardar, así que este módulo es sólo la vista.
 */

/** Divisor de grossing-up: celda F14 del Excel ("no tocar este valor"). */
export const FACTOR_MOVILIDAD = 0.845;

/** IUE 12.5% + IT 3%. La planilla rotula 15.5% aunque su fórmula usa 16%. */
export const RETENCION_MOVILIDAD_RATE = 0.155;

export function round2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/**
 * Lo que el declarante gastó de su bolsillo, más los impuestos que la
 * institución retiene: es el "MONTO Bs" que va impreso en el anexo.
 */
export function calcularMonto(montoGastado: number): number {
  if (!Number.isFinite(montoGastado) || montoGastado <= 0) return 0;
  return round2(montoGastado / FACTOR_MOVILIDAD);
}

export interface ResumenMovilidad {
  totalBruto: number;
  retencion: number;
  totalLiquido: number;
}

/** Las tres filas del pie: TOTAL, menos retención 15.5%, TOTAL líquido. */
export function resumirDeclaracion(montos: number[]): ResumenMovilidad {
  const totalBruto = round2(
    montos.reduce((acc, monto) => acc + (Number.isFinite(monto) ? monto : 0), 0)
  );
  const retencion = round2(totalBruto * RETENCION_MOVILIDAD_RATE);

  return {
    totalBruto,
    retencion,
    totalLiquido: round2(totalBruto - retencion),
  };
}

/**
 * Las fechas del anexo son fechas de calendario, no instantes. Formatearlas con
 * `new Date(iso)` las correría un día en Bolivia (UTC-4), y en una declaración
 * jurada la fecha importa: se toma el tramo de fecha del ISO tal cual.
 */
export function formatFechaAnexo(iso: string | null | undefined): string {
  const [anio, mes, dia] = (iso ?? '').split('T')[0]?.split('-') ?? [];
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : '—';
}
