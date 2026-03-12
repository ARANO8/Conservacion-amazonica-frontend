import { CreateRendicionInput } from '@/types/rendicion-schema';

/**
 * Adapter que transforma el payload del formulario frontend
 * al formato exacto que espera el backend.
 *
 * NOTA: El backend usa un schema .strict() que rechaza propiedades adicionales.
 * Es muy estricto en la estructura esperada.
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

    // Declaración jurada: solo incluir si tiene contenido
    ...(Object.keys(declaracionJurada).length > 0 && {
      declaracionJurada,
    }),

    // Campos booleanos de la declaración: FUERA del objeto declaracionJurada
    confirmaDatosVeridicos:
      data.declaracionJurada?.confirmaDatosVeridicos ?? false,
    aceptaPoliticaDevolucion:
      data.declaracionJurada?.aceptaPoliticaDevolucion ?? false,

    // Solo incluir observaciones generales si no está vacío
    ...(data.observaciones && { observaciones: data.observaciones }),
  };
}
