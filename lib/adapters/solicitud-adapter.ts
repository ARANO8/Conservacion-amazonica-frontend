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
    dias: Number(act.cantDias) || 0, // Enviar valor manual del input (permite decimales)
  }));

  // 2. Mapeo de Viáticos
  const viaticos = (formData.viaticos || []).map((v) => ({
    planificacionIndex: Number(v.planificacionIndex) || 0,
    conceptoId: Number(v.conceptoId) || 0,
    tipoDestino: v.tipoDestino || 'INSTITUCIONAL',
    dias: Number(v.dias) || 0,
    cantidadPersonas: Number(v.cantidadPersonas) || 0,
    montoNeto: Number(v.liquidoPagable) || 0,
    montoPresupuestado: Number(v.montoNeto) || 0,
    poaId: Number(v.solicitudPresupuestoId) || 0,
  }));

  // 3. Mapeo de Gastos (items)
  const gastos = (formData.items || []).map((item) => ({
    poaId: Number(item.solicitudPresupuestoId) || 0,
    tipoGastoId: Number(item.tipoGastoId) || 0,
    tipoDocumento: item.tipoDocumento || 'FACTURA',
    cantidad: Number(item.cantidad) || 1,
    montoNeto: Number(item.liquidoPagable) || 0,
    montoPresupuestado: Number(item.montoNeto) || 0,
    detalle: item.detalle || '',
  }));

  // 4. Mapeo de Nómina
  const nominasTerceros = (formData.nomina || []).map((n) => ({
    nombreCompleto: n.nombreCompleto,
    procedenciaInstitucion: n.procedenciaInstitucion,
  }));

  return {
    poaIds: formData.presupuestosIds || [],
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

import { SolicitudResponse } from '@/types/solicitud-backend';

/**
 * Adapta la respuesta del backend (SolicitudResponse) al formato del formulario (FormData).
 * Útil para hidratar el formulario en modo EDICIÓN.
 */
export const adaptResponseToFormData = (
  response: SolicitudResponse
): Partial<FormData> => {
  // 1. Mapeo de Planificaciones
  const actividades = (response.planificaciones || []).map((p) => ({
    actividadProgramada: p.actividadProgramada,
    fechaInicio: p.fechaInicio
      ? new Date(p.fechaInicio).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    fechaFin: p.fechaFin
      ? new Date(p.fechaFin).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    cantInstitucion: p.cantidadPersonasInstitucional || 0,
    cantTerceros: p.cantidadPersonasTerceros || 0,
    cantDias: p.diasCalculados || 0,
  }));

  // 2. Mapeo de Presupuestos (Fuentes Seleccionadas)
  const fuentesSeleccionadas = (response.presupuestos || []).map((p) => {
    // Nota: El tipo SolicitudResponse actual no define montoPresupuestado en el nivel de presupuesto.
    // Si el backend lo devuelve, se debería actualizar la interfaz.
    // Por ahora, asumimos que podría no estar o lo derivamos si es necesario.
    // Usamos 'as any' solo aquí si estamos seguros que el backend lo manda,
    // pero para cumplir "evitar any", lo trataremos estrictamente segun la interfaz.
    // Si falta en la interfaz, usaremos 0 o lo que dicte el tipo.

    // Si p no tiene montoPresupuestado en la interfaz, esto dará error si accedemos directamente.
    // Para este ejercicio, comentaremos la asignación directa si no existe en el tipo,
    // o asumiremos que el usuario lo agregará.
    // MEJOR OPCION: Verificamos si existe en runtime o usamos 0.

    const montoPresupuestado = 0; // Placeholder ya que no está en SolicitudResponse.presupuestos element

    return {
      id: p.id,
      poaId: p.poa?.id,
      poa: p.poa,
      montoPresupuestado: montoPresupuestado,
      // Estrategia de autosuficiencia para validación inicial
      saldoDisponible: montoPresupuestado,
      // Mapeo adicional para el formulario
      grupoId: p.poa?.estructura?.grupo?.id,
      partidaId: p.poa?.estructura?.partida?.id,
      codigoPresupuestarioId: p.poa?.id,
    };
  });

  // 3. Mapeo de Viáticos
  const viaticos = (response.viaticos || []).map((v) => ({
    id: v.id,
    planificacionIndex: v.planificacionId
      ? (response.planificaciones?.findIndex(
          (p) => p.id === v.planificacionId
        ) ?? 0)
      : 0,
    conceptoId: v.concepto?.id,
    tipoDestino:
      (v.tipoDestino as 'INSTITUCIONAL' | 'TERCEROS') || 'INSTITUCIONAL',
    dias: v.dias || 0,
    cantidadPersonas: v.cantidadPersonas || 0,
    liquidoPagable: Number(v.montoNeto || 0),
    montoNeto: Number(v.montoPresupuestado || 0),
    solicitudPresupuestoId: v.solicitudPresupuestoId || 0,
  }));

  // 4. Mapeo de Gastos (Items)
  const items = (response.gastos || []).map((g) => ({
    solicitudPresupuestoId: g.solicitudPresupuestoId || 0,
    tipoGastoId: g.tipoGasto?.id,
    tipoDocumento: (g.tipoDocumento as 'FACTURA' | 'RECIBO') || 'FACTURA',
    cantidad: g.cantidad || 1,
    liquidoPagable: Number(g.montoNeto || 0),
    montoNeto: Number(g.montoPresupuestado || 0),
    detalle: g.detalle || '',
  }));

  return {
    planificacionLugares: response.lugarViaje || '',
    planificacionObjetivo: response.motivoViaje || '',
    motivo: response.descripcion || '',
    destinatario: '',
    actividades,
    presupuestosIds: fuentesSeleccionadas
      .map((f) => f.poaId)
      .filter((id): id is number => id !== undefined),
    fuentesSeleccionadas,
    viaticos,
    items,
    nomina: (response.personasExternas || []).map((p) => ({
      nombreCompleto: p.nombreCompleto,
      procedenciaInstitucion: p.procedenciaInstitucion,
    })),
  };
};
