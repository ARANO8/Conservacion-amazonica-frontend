/** Sede de trabajo del personal de ACEAA (enum `Sede` del backend). */
export type Sede = 'LA_PAZ' | 'TRINIDAD' | 'COBIJA';

/** Cómo se escribe cada sede en los documentos ("Lugar de emisión"). */
export const ETIQUETA_SEDE: Record<Sede, string> = {
  LA_PAZ: 'La Paz',
  TRINIDAD: 'Trinidad',
  COBIJA: 'Cobija',
};

export const SEDE_OPTIONS = (Object.keys(ETIQUETA_SEDE) as Sede[]).map(
  (value) => ({ value, label: ETIQUETA_SEDE[value] })
);

/** Lugar de emisión cuando el usuario no tiene sede registrada. */
export const LUGAR_EMISION_DEFAULT = 'La Paz';

export function etiquetaSede(sede: Sede | null | undefined): string {
  return sede ? ETIQUETA_SEDE[sede] : LUGAR_EMISION_DEFAULT;
}
