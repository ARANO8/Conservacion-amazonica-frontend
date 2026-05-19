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
  return {
    fecha: form.fecha ? new Date(form.fecha).toISOString() : undefined,
    proveedorNombre: form.proveedorNombre.trim(),
    proveedorTelefono: cleanText(form.proveedorTelefono),
    proveedorDireccion: cleanText(form.proveedorDireccion),
    proveedorCorreo: cleanText(form.proveedorCorreo),
    garantia: cleanText(form.garantia),
    disponibilidad: cleanText(form.disponibilidad),
    duracionCotizacion: cleanText(form.duracionCotizacion),
    emiteFactura: form.emiteFactura ?? false,
    observaciones: cleanText(form.observaciones),
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
    lineas: (cotizacion.lineas ?? []).map((linea) => ({
      cantidad: Number(linea.cantidad) || 0,
      unidad: linea.unidad ?? '',
      detalle: linea.detalle ?? '',
      precioUnitario: Number(linea.precioUnitario) || 0,
    })),
  };
}
