import { z } from 'zod';

/**
 * ANEXO 6 — Declaración Jurada de Movilidad.
 *
 * Documento independiente: no cuelga de una solicitud ni de una rendición,
 * sólo de su autor. No confundir con las "declaraciones juradas" (DJ) que son
 * respaldo de gastos dentro de una rendición (ANEXO 4).
 */

export const DetalleMovilidadSchema = z.object({
  fecha: z.union([z.string().min(1, 'La fecha es requerida'), z.date()]),
  origen: z.string().min(1, 'El origen es requerido'),
  destino: z.string().min(1, 'El destino es requerido'),
  motivo: z.string().min(1, 'El motivo del traslado es requerido'),
  /**
   * Columna auxiliar del Excel: lo que el declarante gastó de su bolsillo.
   * El "MONTO Bs" que se imprime se deriva de aquí y nunca se edita a mano.
   */
  montoGastado: z.coerce
    .number({ invalid_type_error: 'El gasto declarado debe ser un número' })
    .gt(0, 'El gasto declarado debe ser mayor a cero'),
});

export type DetalleMovilidad = z.infer<typeof DetalleMovilidadSchema>;

function esFilaVacia(fila: unknown): boolean {
  if (!fila || typeof fila !== 'object') return true;
  const f = fila as Record<string, unknown>;
  const vacio = (v: unknown) => v === undefined || v === null || v === '';
  return (
    vacio(f.fecha) &&
    vacio(f.origen) &&
    vacio(f.destino) &&
    vacio(f.motivo) &&
    (vacio(f.montoGastado) || Number(f.montoGastado) === 0)
  );
}

/**
 * Tabular en la última celda agrega una fila, así que al guardar casi siempre
 * sobra una al final. Se descartan sólo las vacías del final: recortar en el
 * medio desalinearía los índices con los que la grilla marca los errores.
 */
function quitarFilasVaciasFinales(filas: unknown): unknown {
  if (!Array.isArray(filas)) return filas;
  const copia = [...filas];
  while (copia.length > 0 && esFilaVacia(copia[copia.length - 1])) copia.pop();
  return copia;
}

export const DeclaracionMovilidadSchema = z.object({
  cargo: z.string().min(1, 'El cargo es requerido'),
  motivoActividad: z.string().min(1, 'El motivo o actividad es requerido'),
  proyectoPartida: z
    .string()
    .min(1, 'El proyecto o partida presupuestaria es requerido'),
  lugarEmision: z.string().min(1, 'El lugar de emisión es requerido'),
  fechaEmision: z.union([
    z.string().min(1, 'La fecha de emisión es requerida'),
    z.date(),
  ]),
  detalles: z.preprocess(
    quitarFilasVaciasFinales,
    z
      .array(DetalleMovilidadSchema)
      .min(1, 'Debes registrar al menos un tramo de movilidad')
  ),
});

export type DeclaracionMovilidadInput = z.infer<
  typeof DeclaracionMovilidadSchema
>;

/** Fila en blanco que se agrega al pulsar "Agregar fila" o al tabular al final. */
export const filaMovilidadVacia: DetalleMovilidad = {
  fecha: '',
  origen: '',
  destino: '',
  motivo: '',
  montoGastado: 0,
};

export const defaultDeclaracionMovilidadValues: DeclaracionMovilidadInput = {
  cargo: '',
  motivoActividad: '',
  proyectoPartida: '',
  lugarEmision: 'La Paz',
  fechaEmision: '',
  detalles: [{ ...filaMovilidadVacia }],
};
