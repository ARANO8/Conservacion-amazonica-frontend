/**
 * rendicion-anexo4.ts
 *
 * Cálculos del ANEXO 4 (Rendición de Fondos en Avance) compartidos por el
 * wizard y el detalle de la rendición, para que ambas pantallas muestren
 * exactamente las mismas cifras.
 *
 * Ojo con la terminología, que aquí es la del anexo:
 *   TOTAL → monto bruto, con las retenciones incluidas (lo que se carga al POA)
 *   NETO  → monto líquido, lo que efectivamente se desembolsó
 *   TOTAL − TOTAL IMPUESTOS = NETO
 */

import {
  calcularMontoBrutoRendicion,
  getCategoriaFromPartida,
  type TipoDocRendicion,
  type TipoRetencionGeneral,
} from '@/lib/tax-calculator';

function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number.parseFloat(value.toFixed(2));
}

/** Una fila de la parte impositiva, con el desglose por impuesto. */
export interface DesgloseGasto {
  /** Monto bruto: TOTAL en el anexo */
  bruto: number;
  rcIva: number;
  iue: number;
  it: number;
  totalImpuestos: number;
  /** Monto líquido: NETO en el anexo */
  neto: number;
}

export const DESGLOSE_VACIO: DesgloseGasto = {
  bruto: 0,
  rcIva: 0,
  iue: 0,
  it: 0,
  totalImpuestos: 0,
  neto: 0,
};

interface DesglosarGastoInput {
  /** Monto líquido cargado por el usuario */
  montoLiquido: number;
  tipoDocumento?: string | null;
  tipoRetencion?: string | null;
  /** Nombre de la partida POA, del que se deriva la categoría del gasto */
  nombrePartida?: string | null;
}

/**
 * Desglosa un gasto en sus componentes impositivos. El desglose no se persiste
 * en `GastoRendicion`, pero es reproducible desde el líquido, el tipo de
 * documento, el tipo de retención y la partida, que sí se guardan.
 */
export function desglosarGasto({
  montoLiquido,
  tipoDocumento,
  tipoRetencion,
  nombrePartida,
}: DesglosarGastoInput): DesgloseGasto {
  const liquido = Number(montoLiquido) || 0;
  if (liquido <= 0) return { ...DESGLOSE_VACIO };

  const resultado = calcularMontoBrutoRendicion(
    liquido,
    (tipoDocumento ?? 'FACTURA') as TipoDocRendicion,
    getCategoriaFromPartida(nombrePartida ?? null),
    (tipoRetencion ?? 'SERVICIO') as TipoRetencionGeneral
  );

  // El desglose viene etiquetado; RC-IVA e IVA comparten columna en el anexo.
  const buscar = (predicado: (label: string) => boolean) =>
    resultado.desglose.find((d) => predicado(d.label))?.monto ?? 0;

  return {
    bruto: resultado.montoBruto,
    rcIva: buscar((l) => l.includes('RC-IVA') || l.includes('IVA 13%')),
    iue: buscar((l) => l.includes('IUE')),
    it: buscar((l) => l === 'IT 3%'),
    totalImpuestos: resultado.totalRetenciones,
    neto: resultado.montoNeto,
  };
}

interface DesglosarPersistidoInput {
  /** Monto líquido guardado */
  montoNeto: number;
  /** Monto bruto guardado: el que se cargó al POA */
  montoBruto: number;
  /** Total de impuestos guardado */
  montoImpuestos: number;
  tipoDocumento?: string | null;
  tipoRetencion?: string | null;
  nombrePartida?: string | null;
}

/**
 * Desglosa un gasto **ya guardado**, repartiendo su `montoImpuestos` entre
 * RC-IVA, IUE e IT con las mismas fracciones que usa el backend
 * (`rendiciones.helper.ts`). Se parte de lo persistido y no de las reglas,
 * porque el bruto guardado es el que se cargó al POA: recalcularlo haría que
 * el detalle y el PDF mostraran cifras distintas.
 */
export function desglosarGastoPersistido({
  montoNeto,
  montoBruto,
  montoImpuestos,
  tipoDocumento,
  tipoRetencion,
  nombrePartida,
}: DesglosarPersistidoInput): DesgloseGasto {
  const total = round2(Number(montoImpuestos) || 0);
  const base: DesgloseGasto = {
    ...DESGLOSE_VACIO,
    bruto: round2(Number(montoBruto) || 0),
    neto: round2(Number(montoNeto) || 0),
    totalImpuestos: total,
  };

  if (total <= 0) return base;

  const doc = String(tipoDocumento ?? 'FACTURA');
  if (doc === 'FACTURA' || doc === 'DJ' || doc === 'PPT') return base;

  const categoria = getCategoriaFromPartida(nombrePartida ?? null);

  // Factor 0.87 — sólo RC-IVA 13%
  if (doc === 'LV' || (doc === 'RECIBO' && categoria === 'VIATICO')) {
    return { ...base, rcIva: total };
  }

  // Factor 0.92 — IUE 5% + IT 3% (el total equivale al 8% del bruto)
  if (
    tipoRetencion === 'BIEN' &&
    categoria === 'GENERAL' &&
    (doc === 'RECIBO' || doc === 'BOLETA')
  ) {
    const iue = round2((total * 5) / 8);
    return { ...base, iue, it: round2(total - iue) };
  }

  // Resto (0.84) — 13% + IT 3% (el total equivale al 16% del bruto)
  const rcIva = round2((total * 13) / 16);
  return { ...base, rcIva, it: round2(total - rcIva) };
}

/** Documentos que el anexo cuenta como "Facturas"; el resto va a "Recibos y otros". */
const TIPOS_FACTURA = new Set(['FACTURA']);

export interface ConteoDocumentos {
  facturasCantidad: number;
  facturasMonto: number;
  recibosCantidad: number;
  recibosMonto: number;
  totalCantidad: number;
  totalMonto: number;
}

export interface ResumenAnexo4 {
  /** Totales de cada columna impositiva */
  totales: DesgloseGasto;
  /** Importe recibido menos el líquido gastado */
  saldoEfectivo: number;
  /** Se gastó de más: el proyecto le debe al empleado */
  aFavorEmpleado: number;
  /** Sobró dinero: el empleado devuelve al proyecto */
  aFavorProyecto: number;
  conteoDocumentos: ConteoDocumentos;
}

export interface GastoAnexo4 extends DesglosarGastoInput {
  /** Desglose ya calculado; si no viene se calcula aquí */
  desglose?: DesgloseGasto;
}

/**
 * Totales, liquidación de caja y conteo de documentos de una rendición.
 *
 * El saldo se calcula sobre el **líquido**: es la plata que salió y volverá a
 * moverse al liquidar. La cifra presupuestaria (el bruto con cargo al POA) es
 * otra y se mantiene aparte.
 */
export function resumirAnexo4(
  gastos: GastoAnexo4[],
  importeRecibido: number
): ResumenAnexo4 {
  const totales = { ...DESGLOSE_VACIO };
  const conteo: ConteoDocumentos = {
    facturasCantidad: 0,
    facturasMonto: 0,
    recibosCantidad: 0,
    recibosMonto: 0,
    totalCantidad: 0,
    totalMonto: 0,
  };

  for (const gasto of gastos) {
    const d = gasto.desglose ?? desglosarGasto(gasto);
    if (d.bruto <= 0 && d.neto <= 0) continue;

    totales.bruto = round2(totales.bruto + d.bruto);
    totales.rcIva = round2(totales.rcIva + d.rcIva);
    totales.iue = round2(totales.iue + d.iue);
    totales.it = round2(totales.it + d.it);
    totales.totalImpuestos = round2(totales.totalImpuestos + d.totalImpuestos);
    totales.neto = round2(totales.neto + d.neto);

    // El anexo cuenta el monto desembolsado, no el bruto
    if (TIPOS_FACTURA.has(String(gasto.tipoDocumento ?? 'FACTURA'))) {
      conteo.facturasCantidad += 1;
      conteo.facturasMonto = round2(conteo.facturasMonto + d.neto);
    } else {
      conteo.recibosCantidad += 1;
      conteo.recibosMonto = round2(conteo.recibosMonto + d.neto);
    }
  }

  conteo.totalCantidad = conteo.facturasCantidad + conteo.recibosCantidad;
  conteo.totalMonto = round2(conteo.facturasMonto + conteo.recibosMonto);

  const saldoEfectivo = round2((Number(importeRecibido) || 0) - totales.neto);

  return {
    totales,
    saldoEfectivo,
    aFavorEmpleado: saldoEfectivo < 0 ? round2(Math.abs(saldoEfectivo)) : 0,
    aFavorProyecto: saldoEfectivo > 0 ? saldoEfectivo : 0,
    conteoDocumentos: conteo,
  };
}
