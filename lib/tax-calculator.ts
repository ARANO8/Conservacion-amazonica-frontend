/**
 * tax-calculator.ts
 *
 * Lógica de cálculo de retenciones e impuestos para el módulo de Rendiciones.
 * Clona exactamente las reglas matemáticas definidas en:
 *
 *   - components/solicitudes/solicitud-gastos.tsx
 *       FACTURA → factor 1.00 (sin retención)
 *       RECIBO COMPRA (BIEN) → factor 0.92  (IUE 5%  + IT 3%  = 8%)
 *       RECIBO SERVICIO      → factor 0.84  (IUE 12.5% + IT 3% ≈ 16%)
 *       RECIBO ALQUILER      → factor 0.84  (IVA 13%  + IT 3%  = 16%)
 *
 *   - components/solicitudes/solicitud-hospedajes.tsx
 *       Acrecentamiento Combinado: montoBruto = costoTotal / 0.84
 *       → costoTotal (líquido) = montoBruto × 0.84  (IVA 13% + IT 3%)
 *
 *   - components/solicitudes/solicitud-viaticos.tsx
 *       INSTITUCIONAL: montoNeto (presupuestado) = netoTotal / 0.87
 *       → netoTotal (líquido) = montoNeto × 0.87  (RC-IVA 13%)
 *       TERCEROS:      montoNeto = netoTotal / 0.84
 *       → netoTotal = montoNeto × 0.84  (RC-IVA 13% + IT 3%)
 *
 * En el contexto de Rendición, la terminología invierte la perspectiva:
 *   montoTotal  → lo que realmente se pagó (bruto, incluyendo retenciones)
 *   montoNeto   → lo que recibió el proveedor/beneficiario (líquido)
 */

import { normalizeString } from '@/lib/utils';

function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number.parseFloat(value.toFixed(2));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Categoría del gasto derivada del nombre de la partida POA. */
export type CategoriaGasto = 'VIATICO' | 'HOSPEDAJE' | 'GENERAL';

/** Tipo de documento aceptado en Rendiciones. */
export type TipoDocRendicion =
  | 'FACTURA'
  | 'RECIBO'
  | 'BOLETA'
  | 'LV'
  | 'DJ'
  | 'PPT'
  | 'PAT'
  | 'PVT';

/**
 * Sub-categoría de retención para gastos GENERALES con RECIBO o BOLETA.
 * Replica el campo `tipoGastoId` de solicitud-gastos.tsx (COMPRA/SERVICIO/ALQUILER).
 */
export type TipoRetencionGeneral = 'BIEN' | 'SERVICIO' | 'ALQUILER';

/** Una línea del desglose de impuestos / retenciones. */
export interface DesgloseTax {
  label: string;
  porcentaje: number;
  monto: number;
}

/** Resultado completo del cálculo de impuestos para un comprobante. */
export interface TaxResult {
  /** Monto líquido que recibe el proveedor / beneficiario (sin retenciones). */
  montoNeto: number;
  /** Monto bruto (total con impuestos incluidos) después del gross-up. */
  montoBruto: number;
  /** Total de retenciones/impuestos aplicados (montoBruto − montoNeto). */
  totalRetenciones: number;
  /** Desglose detallado por tipo de retención. */
  desglose: DesgloseTax[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determina la categoría del gasto a partir del nombre de la partida POA.
 * Usa `normalizeString` (sin tildes, UPPERCASE) igual que solicitud-viaticos.tsx
 * y solicitud-gastos.tsx para detectar VIATICO / HOSPEDAJE.
 */
export function getCategoriaFromPartida(
  nombrePartida?: string | null
): CategoriaGasto {
  const n = normalizeString(nombrePartida);
  if (n.includes('VIATICO')) return 'VIATICO';
  if (n.includes('HOSPEDAJE') || n.includes('ALOJAMIENTO')) return 'HOSPEDAJE';
  return 'GENERAL';
}

// ---------------------------------------------------------------------------
// Función principal
// ---------------------------------------------------------------------------

/**
 * Calcula el monto bruto (total con impuestos) a partir del monto líquido (neto).
 * Aplica gross-up: montoBruto = montoNeto / factor.
 *
 * Tabla de reglas:
 *
 * | TipoDoc              | Factor | Retenciones                        |
 * |----------------------|--------|------------------------------------|
 * | FACTURA / DJ / PPT   | 1.00   | Sin retención                      |
 * | LV / RECIBO+VIATICO  | 0.87   | RC-IVA 13%                         |
 * | RECIBO+HOSPEDAJE     | 0.84   | IVA 13% + IT 3%                    |
 * | RECIBO+BIEN          | 0.92   | IUE 5% + IT 3%   (= 8% total)     |
 * | RECIBO+SERVICIO      | 0.84   | RC-IVA 13% + IT 3% (≈ 16% total)  |
 * | RECIBO+ALQUILER      | 0.84   | IVA 13% + IT 3%  (= 16% total)    |
 * | PVT / PAT            | 0.84   | RC-IVA 13% + IT 3% (= 16% total)  |
 *
 * @param montoNeto       Monto líquido (neto, sin impuestos).
 * @param tipoDocumento   Tipo de comprobante presentado.
 * @param categoria       Categoría del gasto (derivada del nombre de la partida POA).
 * @param tipoRetencion   Sub-categoría para gastos GENERALES con RECIBO/BOLETA.
 *                        Por defecto 'SERVICIO' (caso más frecuente).
 */
export function calcularMontoBrutoRendicion(
  montoNeto: number,
  tipoDocumento: TipoDocRendicion,
  categoria: CategoriaGasto,
  tipoRetencion: TipoRetencionGeneral = 'SERVICIO'
): TaxResult {
  const neto = Number.isFinite(montoNeto) ? round2(montoNeto) : 0;

  if (neto <= 0) {
    return { montoNeto: 0, montoBruto: 0, totalRetenciones: 0, desglose: [] };
  }

  // --- 1. FACTURA, DJ, PPT --- Sin retenciones (Factor 1.00)
  if (
    tipoDocumento === 'FACTURA' ||
    tipoDocumento === 'DJ' ||
    tipoDocumento === 'PPT'
  ) {
    return {
      montoNeto: round2(neto),
      montoBruto: round2(neto),
      totalRetenciones: 0,
      desglose: [],
    };
  }

  // --- 2. LV / RECIBO+VIATICO --- Factor 0.87 (RC-IVA 13%)
  if (
    tipoDocumento === 'LV' ||
    (tipoDocumento === 'RECIBO' && categoria === 'VIATICO')
  ) {
    const total = round2(neto / 0.87);
    const rcIva = round2(total * 0.13);
    return {
      montoNeto: round2(neto),
      montoBruto: round2(total),
      totalRetenciones: round2(total - neto),
      desglose: [{ label: 'RC-IVA 13%', porcentaje: 13, monto: round2(rcIva) }],
    };
  }

  // --- 3. PVT / PAT --- Factor 0.84 (RC-IVA 13% + IT 3%)
  if (tipoDocumento === 'PVT' || tipoDocumento === 'PAT') {
    const total = round2(neto / 0.84);
    const rcIva = round2(total * 0.13);
    const it = round2(total * 0.03);
    return {
      montoNeto: round2(neto),
      montoBruto: round2(total),
      totalRetenciones: round2(total - neto),
      desglose: [
        { label: 'RC-IVA 13%', porcentaje: 13, monto: round2(rcIva) },
        { label: 'IT 3%', porcentaje: 3, monto: round2(it) },
      ],
    };
  }

  // --- 4. HOSPEDAJE --- Factor 0.84 (IVA 13% + IT 3%)
  if (categoria === 'HOSPEDAJE') {
    const total = round2(neto / 0.84);
    const iva = round2(total * 0.13);
    const it = round2(total * 0.03);
    return {
      montoNeto: round2(neto),
      montoBruto: round2(total),
      totalRetenciones: round2(total - neto),
      desglose: [
        { label: 'IVA 13%', porcentaje: 13, monto: round2(iva) },
        { label: 'IT 3%', porcentaje: 3, monto: round2(it) },
      ],
    };
  }

  // --- 5. RECIBO/BOLETA GENERAL + BIEN --- Factor 0.92 (IUE 5% + IT 3%)
  if (tipoRetencion === 'BIEN') {
    const total = round2(neto / 0.92);
    const iue = round2(total * 0.05);
    const it = round2(total * 0.03);
    return {
      montoNeto: round2(neto),
      montoBruto: round2(total),
      totalRetenciones: round2(total - neto),
      desglose: [
        { label: 'IUE 5% (Ret. Compra)', porcentaje: 5, monto: round2(iue) },
        { label: 'IT 3%', porcentaje: 3, monto: round2(it) },
      ],
    };
  }

  // ALQUILER o SERVICIO --- Factor 0.84 (RC-IVA/IVA 13% + IT 3%)
  const total = round2(neto / 0.84);
  const ivaLabel = tipoRetencion === 'ALQUILER' ? 'IVA 13%' : 'RC-IVA 13%';
  const ivaMonto = round2(total * 0.13);
  const it = round2(total * 0.03);
  return {
    montoNeto: round2(neto),
    montoBruto: round2(total),
    totalRetenciones: round2(total - neto),
    desglose: [
      { label: ivaLabel, porcentaje: 13, monto: round2(ivaMonto) },
      { label: 'IT 3%', porcentaje: 3, monto: round2(it) },
    ],
  };
}
