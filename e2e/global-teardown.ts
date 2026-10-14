import { existsSync, readFileSync, rmSync } from 'node:fs';
import { literal, sql } from './support/entorno';
import { ARCHIVO_ESTADO, type EstadoCaso } from './liquidacion-viaticos/datos';

/** Deja la base como estaba antes del caso. */
export default async function globalTeardown() {
  if (!existsSync(ARCHIVO_ESTADO)) return;
  const estado = JSON.parse(
    readFileSync(ARCHIVO_ESTADO, 'utf-8')
  ) as EstadoCaso;

  // El setup garantizó que no había ninguna activa: la que quede es de la prueba
  sql(
    `UPDATE "LiquidacionViaticos" SET "deletedAt" = now()
     WHERE "solicitudId" = ${estado.solicitudId} AND "deletedAt" IS NULL`
  );
  if (estado.participantesInsertados.length > 0) {
    sql(
      `DELETE FROM "_PlanificacionParticipantes" WHERE ("A", "B") IN (${estado.participantesInsertados
        .map(([a, b]) => `(${a}, ${b})`)
        .join(', ')})`
    );
  }
  sql(
    `UPDATE "Usuario" SET ci = ${literal(estado.ciOriginal)} WHERE id = ${estado.autorId}`
  );
  rmSync(ARCHIVO_ESTADO);
}
