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
export type TipoDocRendicion = 'FACTURA' | 'RECIBO' | 'BOLETA';

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
  /** Total de retenciones/impuestos aplicados (montoTotal − montoNeto). */
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
 * Calcula el monto neto (líquido a proveedor) dado el monto total pagado.
 *
 * Tabla de reglas (clonadas de los módulos de solicitudes):
 *
 * | TipoDoc         | Categoría            | Factor | Retenciones                        |
 * |-----------------|----------------------|--------|------------------------------------|
 * | FACTURA         | cualquiera           | 1.00   | Sin retención                      |
 * | RECIBO / BOLETA | VIATICO              | 0.87   | RC-IVA 13%                         |
 * | RECIBO / BOLETA | HOSPEDAJE            | 0.84   | IVA 13% + IT 3%                    |
 * | RECIBO / BOLETA | GENERAL + BIEN       | 0.92   | IUE 5% + IT 3%   (= 8% total)     |
 * | RECIBO / BOLETA | GENERAL + SERVICIO   | 0.84   | IUE 12.5% + IT 3% (≈ 16% total)   |
 * | RECIBO / BOLETA | GENERAL + ALQUILER   | 0.84   | IVA 13% + IT 3%  (= 16% total)    |
 *
 * @param montoTotal      Monto bruto pagado (con retenciones incluidas).
 * @param tipoDocumento   Tipo de comprobante presentado.
 * @param categoria       Categoría del gasto (derivada del nombre de la partida POA).
 * @param tipoRetencion   Sub-categoría para gastos GENERALES con RECIBO/BOLETA.
 *                        Por defecto 'SERVICIO' (caso más frecuente).
 */
export function calcularMontoNetoRendicion(
  montoTotal: number,
  tipoDocumento: TipoDocRendicion,
  categoria: CategoriaGasto,
  tipoRetencion: TipoRetencionGeneral = 'SERVICIO'
): TaxResult {
  const brutoRaw = Number(montoTotal);
  const bruto = Number.isFinite(brutoRaw) ? round2(brutoRaw) : 0;

  if (bruto <= 0) {
    return { montoNeto: 0, totalRetenciones: 0, desglose: [] };
  }

  // --- FACTURA: sin retención en ningún caso ---
  // Replica: solicitud-gastos.tsx → if (!isRecibo) return netoTotal (factor 1.0)
  if (tipoDocumento === 'FACTURA') {
    return { montoNeto: round2(bruto), totalRetenciones: 0, desglose: [] };
  }

  // --- RECIBO o BOLETA: factor según categoría ---

  if (categoria === 'VIATICO') {
    // Replica: solicitud-viaticos.tsx → factor INSTITUCIONAL = 0.87 (RC-IVA 13%)
    // montoNeto_solicitud = netoTotal / 0.87  →  netoTotal = montoNeto × 0.87
    // En rendición: montoTotal = montoNeto_solicitud (bruto), montoNeto = netoTotal (líquido)
    const neto = round2(bruto * 0.87);
    const rcIva = round2(bruto * 0.13);
    return {
      montoNeto: round2(neto),
      totalRetenciones: round2(bruto - neto),
      desglose: [{ label: 'RC-IVA 13%', porcentaje: 13, monto: round2(rcIva) }],
    };
  }

  if (categoria === 'HOSPEDAJE') {
    // Replica: solicitud-hospedajes.tsx → Acrecentamiento Combinado / 0.84 (IVA 13% + IT 3%)
    // montoBruto = costoTotal / 0.84  →  costoTotal = montoBruto × 0.84
    // En rendición: montoTotal = montoBruto, montoNeto = costoTotal (lo que recibe el hotel)
    const neto = round2(bruto * 0.84);
    const iva = round2(bruto * 0.13);
    const it = round2(bruto * 0.03);
    return {
      montoNeto: round2(neto),
      totalRetenciones: round2(bruto - neto),
      desglose: [
        { label: 'IVA 13%', porcentaje: 13, monto: round2(iva) },
        { label: 'IT 3%', porcentaje: 3, monto: round2(it) },
      ],
    };
  }

  // --- GENERAL: sub-factor según tipoRetencion ---
  // Replica: solicitud-gastos.tsx → switch (tipoNombre) con factor por tipo

  if (tipoRetencion === 'BIEN') {
    // Ret. Compra 8%: IUE 5% + IT 3% → factor 0.92
    // Replica: tipoNombre === 'COMPRA' → factor = 0.92
    const neto = round2(bruto * 0.92);
    const iue = round2(bruto * 0.05);
    const it = round2(bruto * 0.03);
    return {
      montoNeto: round2(neto),
      totalRetenciones: round2(bruto - neto),
      desglose: [
        { label: 'IUE 5% (Ret. Compra)', porcentaje: 5, monto: round2(iue) },
        { label: 'IT 3%', porcentaje: 3, monto: round2(it) },
      ],
    };
  }

  if (tipoRetencion === 'ALQUILER') {
    // Ret. Alquiler 16%: IVA 13% + IT 3% → factor 0.84
    // Replica: tipoNombre.includes('ALQUILER') → factor = 0.84
    const neto = round2(bruto * 0.84);
    const iva = round2(bruto * 0.13);
    const it = round2(bruto * 0.03);
    return {
      montoNeto: round2(neto),
      totalRetenciones: round2(bruto - neto),
      desglose: [
        { label: 'IVA 13%', porcentaje: 13, monto: round2(iva) },
        { label: 'IT 3%', porcentaje: 3, monto: round2(it) },
      ],
    };
  }

  // SERVICIO (default): IUE 12.5% + IT 3% → factor 0.84
  // Replica: tipoNombre.includes('SERVICIO') → factor = 0.84
  // Desglose: iue = bruto × 0.125, it = bruto × 0.03 (solicitud-gastos.tsx líneas 242–243)
  const neto = round2(bruto * 0.84);
  const iue = round2(bruto * 0.125);
  const it = round2(bruto * 0.03);
  return {
    montoNeto: round2(neto),
    totalRetenciones: round2(bruto - neto),
    desglose: [
      {
        label: 'IUE 12.5% (Ret. Servicios)',
        porcentaje: 12.5,
        monto: round2(iue),
      },
      { label: 'IT 3%', porcentaje: 3, monto: round2(it) },
    ],
  };
}
