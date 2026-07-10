import type { CuadroComparativoFormData } from '@/components/cuadros-comparativos/cuadro-comparativo-schema';
import type {
  CreateCuadroComparativoPayload,
  CuadroComparativoResponse,
} from '@/types/cuadro-comparativo-backend';

const cleanText = (value?: string): string | undefined => {
  const t = value?.trim();
  return t ? t : undefined;
};

export function adaptCuadroFormToPayload(
  form: CuadroComparativoFormData
): CreateCuadroComparativoPayload {
  return {
    lugarFecha: cleanText(form.lugarFecha),
    observaciones: cleanText(form.observaciones),
    recomendadaCotizacionIndex:
      form.recomendadaIndex === null ? undefined : form.recomendadaIndex,
    cotizaciones: form.cotizaciones.map((c, i) => ({
      orden: i + 1,
      cotizacionId: c.cotizacionId,
    })),
    items: form.items.map((item, idx) => ({
      orden: idx + 1,
      descripcion: item.descripcion.trim(),
      cantidad: Number(item.cantidad) || 0,
      unidad: cleanText(item.unidad),
      ganadoraCotizacionIndex:
        item.ganadoraIndex === null ? undefined : item.ganadoraIndex,
      precios: item.precios.map((p, ci) => ({
        cotizacionIndex: ci,
        precioUnitario: p.noMenciona
          ? undefined
          : Number(p.precioUnitario) || 0,
        noMenciona: p.noMenciona,
      })),
    })),
  };
}

export function adaptCuadroResponseToForm(
  cuadro: CuadroComparativoResponse
): CuadroComparativoFormData {
  const columnas = [...cuadro.cotizaciones].sort((a, b) => a.orden - b.orden);
  const colIndexById = new Map(columnas.map((c, i) => [c.id, i]));

  const items = [...cuadro.items]
    .sort((a, b) => a.orden - b.orden)
    .map((item) => {
      const precioByCol = new Map(
        item.precios.map((p) => [p.cuadroCotizacionId, p])
      );
      return {
        descripcion: item.descripcion,
        cantidad: Number(item.cantidad) || 0,
        unidad: item.unidad ?? '',
        ganadoraIndex:
          item.cotizacionGanadoraId !== null
            ? (colIndexById.get(item.cotizacionGanadoraId) ?? null)
            : null,
        precios: columnas.map((col) => {
          const p = precioByCol.get(col.id);
          return {
            precioUnitario: p ? Number(p.precioUnitario ?? 0) : 0,
            noMenciona: p?.noMenciona ?? true,
          };
        }),
      };
    });

  return {
    lugarFecha: cuadro.lugarFecha ?? '',
    observaciones: cuadro.observaciones ?? '',
    recomendadaIndex:
      cuadro.cotizacionRecomendadaId !== null
        ? (colIndexById.get(cuadro.cotizacionRecomendadaId) ?? null)
        : null,
    cotizaciones: columnas.map((c) => ({
      cotizacionId: c.cotizacionId,
      proveedorNombre: c.proveedorNombre,
    })),
    items,
  };
}
