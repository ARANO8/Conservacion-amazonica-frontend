import { FormData } from '@/components/solicitudes/solicitud-schema';
import { CreateSolicitudPayload } from '@/types/solicitud-backend';

/**
 * Adapta los datos del formulario (Zod) al formato que espera el el backend.
 *
 * @param formData Datos capturados por React Hook Form
 * @param aprobadorId ID del usuario aprobador seleccionado en el modal
 * @returns Payload listo para POST /solicitudes
 */
export const adaptFormToPayload = (
  formData: FormData,
  aprobadorId: number
): CreateSolicitudPayload => {
  // 1. Mapeo de Planificaciones (Actividades)
  const planificaciones = formData.actividades.map((act) => ({
    actividad: act.actividadProgramada,
    fechaInicio: new Date(act.fechaInicio).toISOString(),
    fechaFin: new Date(act.fechaFin).toISOString(),
    cantInstitucional: Number(act.cantInstitucion) || 0,
    cantTerceros: Number(act.cantTerceros) || 0,
  }));

  // 2. Mapeo de Viáticos
  const viaticos = (formData.viaticos || []).map((v) => ({
    planificacionIndex: Number(v.planificacionIndex) || 0,
    conceptoId: Number(v.conceptoId) || 0,
    tipoDestino: v.tipoDestino || 'INSTITUCIONAL',
    dias: Number(v.dias) || 0,
    cantidadPersonas: Number(v.cantidadPersonas) || 0,
    montoNeto: Number(v.montoNeto) || 0,
    solicitudPresupuestoId: Number(v.solicitudPresupuestoId) || 0,
  }));

  // 3. Mapeo de Gastos (items)
  const gastos = (formData.items || []).map((item) => ({
    solicitudPresupuestoId: Number(item.solicitudPresupuestoId) || 0,
    tipoGastoId: Number(item.tipoGastoId) || 0,
    tipoDocumento: item.tipoDocumento || 'FACTURA',
    cantidad: Number(item.cantidad) || 1,
    montoNeto: Number(item.montoNeto) || 0,
    detalle: item.detalle || '',
  }));

  // 4. Mapeo de Nómina
  const nominasTerceros = (formData.nomina || []).map((n) => ({
    nombreCompleto: n.nombreCompleto,
    ci: n.ci,
  }));

  return {
    presupuestosIds: formData.presupuestosIds || [],
    aprobadorId: aprobadorId,
    lugarViaje: formData.planificacionLugares,
    motivoViaje: formData.planificacionObjetivo,
    descripcion: formData.motivo,
    planificaciones,
    viaticos,
    gastos,
    nominasTerceros,
  };
};
