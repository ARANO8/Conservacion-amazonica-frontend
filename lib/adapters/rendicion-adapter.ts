import { CreateRendicionInput } from '@/types/rendicion-schema';

/**
 * Adapter que transforma el payload del formulario frontend
 * al formato exacto que espera el backend.
 *
 * NOTA: El backend usa un schema .strict() que rechaza cualquier propiedad
 * que no esté explícitamente definida. No espera confirmaDatosVeridicos
 * ni aceptaPoliticaDevolucion como campos (son solo para validación del formulario).
 */
export function adaptCreateRendicionPayload(
  data: CreateRendicionInput
): Record<string, unknown> {
  // Construir el objeto declaracionJurada solo con los campos que el backend espera
  const declaracionJurada: Record<string, unknown> = {};

  if (data.declaracionJurada) {
    // Solo incluir tipoDeclaracion si existe
    if (data.declaracionJurada.tipoDeclaracion) {
      declaracionJurada.tipoDeclaracion =
        data.declaracionJurada.tipoDeclaracion;
    }

    // Solo incluir montoADevolver si existe y es mayor a 0
    if (
      data.declaracionJurada.montoADevolver &&
      data.declaracionJurada.montoADevolver > 0
    ) {
      declaracionJurada.montoADevolver = Number(
        data.declaracionJurada.montoADevolver
      );
    }

    // Solo incluir observaciones si no está vacío
    if (data.declaracionJurada.observaciones) {
      declaracionJurada.observaciones = data.declaracionJurada.observaciones;
    }
  }

  return {
    solicitudId: data.solicitudId,
    fechaRendicion: data.fechaRendicion,

    // Gastos con respaldo: solo incluir si hay elementos
    ...(data.gastos &&
      data.gastos.length > 0 && {
        gastos: data.gastos.map((gasto) => ({
          // Solo incluir solicitudItemId si existe
          ...(gasto.solicitudItemId !== undefined && {
            solicitudItemId: gasto.solicitudItemId,
          }),
          concepto: gasto.concepto,
          // Solo incluir detalle si no está vacío
          ...(gasto.detalle && { detalle: gasto.detalle }),
          tipoDocumento: gasto.tipoDocumento,
          // Solo incluir numeroDocumento si no está vacío
          ...(gasto.numeroDocumento && {
            numeroDocumento: gasto.numeroDocumento,
          }),
          // Solo incluir proveedor si no está vacío
          ...(gasto.proveedor && { proveedor: gasto.proveedor }),
          // Convertir fecha a ISO string si es Date
          ...(gasto.fechaDocumento && {
            fechaDocumento:
              gasto.fechaDocumento instanceof Date
                ? gasto.fechaDocumento.toISOString().split('T')[0]
                : gasto.fechaDocumento,
          }),
          montoTotal: Number(gasto.montoTotal),
          montoNeto: Number(gasto.montoNeto),
          // Solo incluir estado si existe
          ...(gasto.estado && { estado: gasto.estado }),
        })),
      }),

    // Gastos sin respaldo: solo incluir si hay elementos
    ...(data.gastosSinRespaldo &&
      data.gastosSinRespaldo.length > 0 && {
        gastosSinRespaldo: data.gastosSinRespaldo.map((gasto) => ({
          // Convertir fecha a ISO string si es Date
          ...(gasto.fechaGasto && {
            fechaGasto:
              gasto.fechaGasto instanceof Date
                ? gasto.fechaGasto.toISOString().split('T')[0]
                : gasto.fechaGasto,
          }),
          detalle: gasto.detalle,
          monto: Number(gasto.monto),
        })),
      }),

    // Informe de gastos (Anexo 7): solo incluir si existe y tiene actividades
    ...(data.informeGastos?.actividades &&
      data.informeGastos.actividades.length > 0 && {
        informeGastos: {
          ...(data.informeGastos.fechaInicio && {
            fechaInicio:
              data.informeGastos.fechaInicio instanceof Date
                ? data.informeGastos.fechaInicio.toISOString().split('T')[0]
                : data.informeGastos.fechaInicio,
          }),
          ...(data.informeGastos.fechaFin && {
            fechaFin:
              data.informeGastos.fechaFin instanceof Date
                ? data.informeGastos.fechaFin.toISOString().split('T')[0]
                : data.informeGastos.fechaFin,
          }),
          actividades: data.informeGastos.actividades.map((actividad) => ({
            ...(actividad.fecha && {
              fecha:
                actividad.fecha instanceof Date
                  ? actividad.fecha.toISOString().split('T')[0]
                  : actividad.fecha,
            }),
            lugar: actividad.lugar,
            personaInstitucion: actividad.personaInstitucion,
            actividadesRealizadas: actividad.actividadesRealizadas,
          })),
        },
      }),

    // Declaración jurada: solo incluir si tiene contenido
    ...(Object.keys(declaracionJurada).length > 0 && {
      declaracionJurada,
    }),

    // Solo incluir observaciones generales si no está vacío
    ...(data.observaciones && { observaciones: data.observaciones }),
  };
}
