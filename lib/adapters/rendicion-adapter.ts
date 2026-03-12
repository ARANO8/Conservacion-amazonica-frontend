import { CreateRendicionInput } from '@/types/rendicion-schema';

/**
 * Adapter que transforma el payload del formulario frontend
 * al formato exacto que espera el backend.
 *
 * El frontend usa campos opcionales y validación lenient,
 * pero el backend espera una estructura específica.
 */
export function adaptCreateRendicionPayload(
  data: CreateRendicionInput
): Record<string, unknown> {
  return {
    solicitudId: data.solicitudId,
    fechaRendicion: data.fechaRendicion,

    // Gastos con respaldo: solo incluir si hay elementos
    gastos:
      data.gastos && data.gastos.length > 0
        ? data.gastos.map((gasto) => ({
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
          }))
        : undefined,

    // Gastos sin respaldo: solo incluir si hay elementos
    gastosSinRespaldo:
      data.gastosSinRespaldo && data.gastosSinRespaldo.length > 0
        ? data.gastosSinRespaldo.map((gasto) => ({
            // Convertir fecha a ISO string si es Date
            ...(gasto.fechaGasto && {
              fechaGasto:
                gasto.fechaGasto instanceof Date
                  ? gasto.fechaGasto.toISOString().split('T')[0]
                  : gasto.fechaGasto,
            }),
            detalle: gasto.detalle,
            monto: Number(gasto.monto),
          }))
        : undefined,

    // Declaración jurada: solo incluir si existe
    ...(data.declaracionJurada && {
      declaracionJurada: {
        // Solo incluir tipoDeclaracion si existe
        ...(data.declaracionJurada.tipoDeclaracion && {
          tipoDeclaracion: data.declaracionJurada.tipoDeclaracion,
        }),
        confirmaDatosVeridicos: data.declaracionJurada.confirmaDatosVeridicos,
        aceptaPoliticaDevolucion:
          data.declaracionJurada.aceptaPoliticaDevolucion,
        // Solo incluir montoADevolver si existe y es mayor a 0
        ...(data.declaracionJurada.montoADevolver &&
          data.declaracionJurada.montoADevolver > 0 && {
            montoADevolver: Number(data.declaracionJurada.montoADevolver),
          }),
        // Solo incluir observaciones si no está vacío
        ...(data.declaracionJurada.observaciones && {
          observaciones: data.declaracionJurada.observaciones,
        }),
      },
    }),

    // Solo incluir observaciones generales si no está vacío
    ...(data.observaciones && { observaciones: data.observaciones }),
  };
}
