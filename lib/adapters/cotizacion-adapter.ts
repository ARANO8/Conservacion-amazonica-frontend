import type { CotizacionFormData } from '@/components/cotizaciones/cotizacion-schema';
import type {
  CotizacionResponse,
  CreateCotizacionPayload,
} from '@/types/cotizacion-backend';

const cleanText = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export function adaptCotizacionFormToPayload(
  form: CotizacionFormData
): CreateCotizacionPayload {
  const isExterna = form.tipo === 'EXTERNA';
  return {
    tipo: form.tipo ?? 'PROPIA',
    fecha: form.fecha ? new Date(form.fecha).toISOString() : undefined,
    proveedorNombre: form.proveedorNombre.trim(),
    proveedorTelefono: isExterna
      ? undefined
      : cleanText(form.proveedorTelefono),
    proveedorDireccion: isExterna
      ? undefined
      : cleanText(form.proveedorDireccion),
    proveedorCorreo: isExterna ? undefined : cleanText(form.proveedorCorreo),
    garantia: isExterna ? undefined : cleanText(form.garantia),
    disponibilidad: isExterna ? undefined : cleanText(form.disponibilidad),
    duracionCotizacion: isExterna
      ? undefined
      : cleanText(form.duracionCotizacion),
    emiteFactura: isExterna ? false : (form.emiteFactura ?? false),
    observaciones: cleanText(form.observaciones),
    adjuntoUrl: cleanText(form.adjuntoUrl),
    lineas: form.lineas.map((linea) => ({
      cantidad: Number(linea.cantidad) || 0,
      unidad: cleanText(linea.unidad),
      detalle: linea.detalle.trim(),
      precioUnitario: Number(linea.precioUnitario) || 0,
    })),
  };
}

export function adaptCotizacionResponseToForm(
  cotizacion: CotizacionResponse
): CotizacionFormData {
  return {
    tipo: cotizacion.tipo ?? 'PROPIA',
    fecha: cotizacion.fecha ? cotizacion.fecha.slice(0, 10) : '',
    proveedorNombre: cotizacion.proveedorNombre ?? '',
    proveedorTelefono: cotizacion.proveedorTelefono ?? '',
    proveedorDireccion: cotizacion.proveedorDireccion ?? '',
    proveedorCorreo: cotizacion.proveedorCorreo ?? '',
    garantia: cotizacion.garantia ?? '',
    disponibilidad: cotizacion.disponibilidad ?? '',
    duracionCotizacion: cotizacion.duracionCotizacion ?? '',
    emiteFactura: cotizacion.emiteFactura ?? false,
    observaciones: cotizacion.observaciones ?? '',
    adjuntoUrl: cotizacion.adjuntoUrl ?? '',
    lineas: (cotizacion.lineas ?? []).map((linea) => ({
      cantidad: Number(linea.cantidad) || 0,
      unidad: linea.unidad ?? '',
      detalle: linea.detalle ?? '',
      precioUnitario: Number(linea.precioUnitario) || 0,
    })),
  };
}
