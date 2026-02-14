import { FormData } from '@/components/solicitudes/solicitud-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { Concepto, TipoGasto } from '@/types/catalogs';
import { SeleccionPresupuesto } from '@/types/backend';
import { PartidaGroup, BreakdownItem } from '@/types/breakdown';

/**
 * Mapea los datos del formulario (creación) al formato del componente de desglose.
 */
export function mapFormToBreakdown(
  data: FormData,
  selecciones: SeleccionPresupuesto[],
  conceptos: Concepto[],
  tiposGasto: TipoGasto[]
): PartidaGroup[] {
  if (!data.fuentesSeleccionadas) return [];

  return data.fuentesSeleccionadas
    .map((fuente): PartidaGroup | null => {
      const seleccion = selecciones.find((s) => s.poaId === fuente.poaId);
      if (!seleccion) return null;

      const nombrePartida =
        seleccion.poa?.estructura?.partida?.nombre || 'Sin Nombre';
      const esViatico = nombrePartida.toUpperCase().includes('VIATICOS');

      const viaticosAsociados = (data.viaticos || []).filter(
        (v) => v.solicitudPresupuestoId === seleccion.poaId
      );
      const gastosAsociados = (data.items || []).filter(
        (i) => i.solicitudPresupuestoId === seleccion.poaId
      );

      const items: BreakdownItem[] = esViatico
        ? viaticosAsociados.map((v) => ({
            id: v.id || 0,
            nombre:
              conceptos.find((c) => c.id === v.conceptoId)?.nombre || 'Viático',
            detalle:
              data.actividades?.[v.planificacionIndex ?? -1]
                ?.actividadProgramada,
            tipoDestino: v.tipoDestino,
            montoNeto: Number(v.montoNeto) || 0,
            montoLiquido: Number(v.liquidoPagable ?? v.montoNeto) || 0,
          }))
        : gastosAsociados.map((item) => ({
            id: item.tipoGastoId || 0,
            nombre:
              tiposGasto.find((t) => t.id === item.tipoGastoId)?.nombre ||
              'Gasto',
            detalle: item.detalle || item.tipoDocumento || 'Sin detalle',
            montoNeto: Number(item.montoNeto) || 0,
            montoLiquido: Number(item.liquidoPagable ?? item.montoNeto) || 0,
          }));

      const totalPresupuestado = items.reduce(
        (acc, item) => acc + item.montoNeto,
        0
      );
      const totalLiquido = items.reduce(
        (acc, item) => acc + item.montoLiquido,
        0
      );

      return {
        reservaId: seleccion.poaId,
        partidaNombre: nombrePartida,
        actividadDescripcion: seleccion.poa?.actividad?.detalleDescripcion,
        esViatico,
        items,
        totalLiquido,
        totalPresupuestado,
      };
    })
    .filter((group): group is PartidaGroup => group !== null);
}

/**
 * Mapea la respuesta del backend (detalle) al formato del componente de desglose.
 * Utiliza la optimización de items anidados en presupuestos.
 */
export function mapResponseToBreakdown(
  solicitud: SolicitudResponse
): PartidaGroup[] {
  if (!solicitud.presupuestos) return [];

  return solicitud.presupuestos.map((pres) => {
    const nombrePartida = pres.poa?.estructura?.partida?.nombre || 'Sin Nombre';
    const esViatico = nombrePartida.toUpperCase().includes('VIATICOS');

    const viaticosAsociados = (solicitud.viaticos || []).filter(
      (v) => v.solicitudPresupuestoId === pres.id
    );

    // Buscamos en la lista GLOBAL 'solicitud.gastos' que tiene el tipoGasto poblado.
    const gastosAsociados = (solicitud.gastos || []).filter(
      (g) => g.solicitudPresupuestoId === pres.id
    );

    const items: BreakdownItem[] = esViatico
      ? viaticosAsociados.map((v) => {
          // Buscar la planificación asociada para obtener la actividad programada
          const planificacion = solicitud.planificaciones?.find(
            (p) => p.id === v.planificacionId
          );
          return {
            id: v.id,
            nombre: v.concepto?.nombre || 'Viático',
            detalle: planificacion?.actividadProgramada,
            tipoDestino: v.tipoDestino,
            montoNeto: Number(v.montoPresupuestado) || 0,
            montoLiquido: Number(v.montoNeto) || 0,
          };
        })
      : gastosAsociados.map((g) => {
          return {
            id: g.id,
            nombre: g.tipoGasto?.nombre || 'Gasto',
            detalle: g.tipoDocumento || 'Sin detalle',
            montoNeto: Number(g.montoPresupuestado) || 0,
            montoLiquido: Number(g.montoNeto) || 0,
          };
        });

    const totalPresupuestado = items.reduce(
      (acc, item) => acc + item.montoNeto,
      0
    );
    const totalLiquido = items.reduce(
      (acc, item) => acc + item.montoLiquido,
      0
    );

    return {
      reservaId: pres.id,
      partidaNombre: nombrePartida,
      actividadDescripcion: pres.poa?.actividad?.detalleDescripcion,
      esViatico,
      items,
      totalLiquido,
      totalPresupuestado,
    };
  });
}
