import path from 'node:path';

/**
 * Datos del caso E2E de la Liquidación de Viáticos (ANEXO 5), sobre la base de
 * desarrollo sembrada. El setup agrega al personal institucional a las
 * actividades de la solicitud (las solicitudes antiguas no lo tienen) y el
 * teardown lo quita, junto con la liquidación que cree la prueba.
 */
export const CASO = {
  codigoSolicitud: 'SOL-2026-001',
  /** Emisor de la solicitud: arma la liquidación */
  autor: 'larteaga@conservacionamazonica.org.bo',
  /** Director de Programa que la revisa */
  revisor: 'dlarrea@conservacionamazonica.org.bo',
  /** Compañero de viaje: segunda hoja */
  companero: 'cdeugarte@conservacionamazonica.org.bo',
  ciAutor: '4876543 LP',
};

/**
 * Importes esperados con las tarifas vigentes (Ciudad 250, Pueblo 144):
 * - Autor: Ciudad 9 días + Pueblo 2 días. Con la fila de Ciudad al 50 %:
 *   líquido 250 × 9 × 50 % + 144 × 2 = 1.125 + 288 = 1.413,00
 *   bruto 1.293,10 + 331,03 = 1.624,13 → RC-IVA 211,13
 * - Compañero: Ciudad 9 días al 100 % = 2.250,00 líquido
 * - Total del viaje: 3.663,00 (presupuestado para viáticos: 5.880,00)
 */
export const ESPERADO = {
  autorPrecargado: '2.538,00',
  autorLiquido: '1.413,00',
  autorBruto: '1.624,13',
  autorRcIva: '211,13',
  companeroLiquido: '2.250,00',
  total: '3.663,00',
};

/** Lo que el setup cambió, para que el teardown lo deshaga. */
export const ARCHIVO_ESTADO = path.join(
  __dirname,
  '..',
  '.estado-liquidacion-viaticos.json'
);

export interface EstadoCaso {
  solicitudId: number;
  participantesInsertados: [number, number][];
  autorId: number;
  ciOriginal: string | null;
}

/** "1.413,00" → /Bs\s?1\.413,00/ tal como lo formatea formatMoney (es-BO). */
export function bs(monto: string): RegExp {
  return new RegExp(`Bs\\s?${monto.replace(/\./g, '\\.')}`);
}
