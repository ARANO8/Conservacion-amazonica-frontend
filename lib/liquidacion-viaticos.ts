/**
 * Cálculo del ANEXO 5 para la vista previa del formulario. Replica
 * `src/liquidaciones-viaticos/liquidacion.helper.ts` del backend: si cambia
 * una, debe cambiar la otra. El backend recalcula siempre al guardar.
 *
 * Se parte del líquido (tarifa × días × %) y el bruto sale de él con el factor
 * del RC-IVA 13%: lo que la persona recibe queda exacto.
 */

/** RC-IVA 13% de los viáticos: líquido = bruto × 0.87 */
export const FACTOR_RETENCION_VIATICOS = 0.87;

/** Viático completo o medio viático, como en el manual. */
export const PORCENTAJES_VIATICO = [100, 50] as const;

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

const ESCALA_POR_CONCEPTO: Record<string, string> = {
  CIUDADES_PRINCIPALES: 'Ciudad',
  CIUDADES_INTERMEDIAS: 'Ciudad intermedia',
  PUEBLOS: 'Pueblo',
  COMUNIDADES: 'Comunidad',
  EXTERIOR: 'Exterior',
  PAISES_SUDAMERICA: 'Exterior',
  PAISES_NORTEAMERICA_EUROPA: 'Exterior',
  PAISES_LIMITROFES: 'Exterior',
};

export function escalaDeConcepto(nombreConcepto: string): string {
  return ESCALA_POR_CONCEPTO[nombreConcepto] ?? nombreConcepto;
}

/** "Viático Ciudad 100%", como la columna Descripción del formulario. */
export function descripcionFila(nombreConcepto: string, porcentaje: number) {
  return `Viático ${escalaDeConcepto(nombreConcepto)} ${porcentaje}%`;
}

export interface FilaCalculada {
  totalLiquido: number;
  totalBruto: number;
}

export function calcularFila(
  tarifaLiquida: number,
  dias: number,
  porcentaje: number
): FilaCalculada {
  const totalLiquido = round2((tarifaLiquida * dias * porcentaje) / 100);
  return {
    totalLiquido,
    totalBruto: round2(totalLiquido / FACTOR_RETENCION_VIATICOS),
  };
}

/** Importe por día que imprime el formulario: la tarifa en bruto. */
export function importeDiaBruto(tarifaLiquida: number, porcentaje: number) {
  return round2((tarifaLiquida * porcentaje) / 100 / FACTOR_RETENCION_VIATICOS);
}

export interface TotalesHoja {
  totalLiquido: number;
  totalBruto: number;
  rcIva: number;
}

/** El bruto es la suma de los brutos de las filas; la retención, la diferencia. */
export function totalizarHoja(filas: FilaCalculada[]): TotalesHoja {
  const totalLiquido = round2(filas.reduce((s, f) => s + f.totalLiquido, 0));
  const totalBruto = round2(filas.reduce((s, f) => s + f.totalBruto, 0));
  return { totalLiquido, totalBruto, rcIva: round2(totalBruto - totalLiquido) };
}

/** La escala de la hoja: la del tipo de destino con más días. */
export function escalaPredominante(
  filas: { nombreConcepto: string; dias: number }[]
): string {
  const dias = new Map<string, number>();
  for (const f of filas) {
    const escala = escalaDeConcepto(f.nombreConcepto);
    dias.set(escala, (dias.get(escala) ?? 0) + f.dias);
  }
  let mejor = '';
  let max = 0;
  for (const [escala, total] of dias) {
    if (total > max) {
      mejor = escala;
      max = total;
    }
  }
  return mejor;
}
