import { writeFileSync } from 'node:fs';
import {
  API_URL,
  FRONT_URL,
  esperarServidor,
  literal,
  sql,
  usuarioPorEmail,
} from './support/entorno';
import {
  ARCHIVO_ESTADO,
  CASO,
  type EstadoCaso,
} from './liquidacion-viaticos/datos';

/**
 * Prepara la base de desarrollo para el caso de la Liquidación de Viáticos.
 * No borra nada existente: si la solicitud ya tiene una liquidación activa, se
 * detiene y pide limpiarla a mano.
 */
export default async function globalSetup() {
  await esperarServidor(
    `${API_URL}/health`,
    'pnpm run start:dev (en Conservacion-amazonica-backend)'
  );
  await esperarServidor(`${FRONT_URL}/login`, 'pnpm run dev');

  const autor = usuarioPorEmail(CASO.autor);
  const companero = usuarioPorEmail(CASO.companero);
  usuarioPorEmail(CASO.revisor);

  const [solicitud] = sql(
    `SELECT id, estado, "planViajeId", "usuarioEmisorId" FROM "Solicitud"
     WHERE "codigoSolicitud" = ${literal(CASO.codigoSolicitud)} AND "deletedAt" IS NULL`
  );
  if (!solicitud) {
    throw new Error(`No existe la solicitud ${CASO.codigoSolicitud}`);
  }
  const [solicitudId, estado, planViajeId, emisorId] = solicitud;
  if (estado !== 'DESEMBOLSADO') {
    throw new Error(
      `${CASO.codigoSolicitud} debe estar DESEMBOLSADO para rendirse (está ${estado})`
    );
  }
  if (Number(emisorId) !== autor.id) {
    throw new Error(`${CASO.codigoSolicitud} no es de ${CASO.autor}`);
  }

  const [[activas]] = sql(
    `SELECT count(*) FROM "LiquidacionViaticos"
     WHERE "solicitudId" = ${solicitudId} AND "deletedAt" IS NULL`
  );
  if (Number(activas) > 0) {
    throw new Error(
      `${CASO.codigoSolicitud} ya tiene una liquidación activa: elimínala antes de correr el caso`
    );
  }

  // Personal institucional: el autor en todas las actividades, el compañero
  // en todas menos la última (así sus hojas quedan distintas)
  const actividades = sql(
    `SELECT id FROM "Planificacion" WHERE "planViajeId" = ${planViajeId} ORDER BY id`
  ).map(([id]) => Number(id));
  if (actividades.length < 2) {
    throw new Error(
      `${CASO.codigoSolicitud} necesita al menos dos actividades`
    );
  }
  const pares = [
    ...actividades.map((a) => [a, autor.id]),
    ...actividades.slice(0, -1).map((a) => [a, companero.id]),
  ];
  const insertados = sql(
    `INSERT INTO "_PlanificacionParticipantes" ("A", "B") VALUES
     ${pares.map(([a, b]) => `(${a}, ${b})`).join(', ')}
     ON CONFLICT DO NOTHING RETURNING "A", "B"`
  ).map(([a, b]) => [Number(a), Number(b)] as [number, number]);

  const [[ciOriginal]] = sql(
    `SELECT coalesce(ci, '<null>') FROM "Usuario" WHERE id = ${autor.id}`
  );
  sql(
    `UPDATE "Usuario" SET ci = ${literal(CASO.ciAutor)} WHERE id = ${autor.id}`
  );

  const estadoCaso: EstadoCaso = {
    solicitudId: Number(solicitudId),
    participantesInsertados: insertados,
    autorId: autor.id,
    ciOriginal: ciOriginal === '<null>' ? null : ciOriginal,
  };
  writeFileSync(ARCHIVO_ESTADO, JSON.stringify(estadoCaso, null, 2));
}
