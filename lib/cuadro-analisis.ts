/**
 * Análisis y recomendación automática del cuadro comparativo.
 *
 * Criterio: cobertura + menor total. Recomienda el proveedor más barato
 * que cotiza todos los ítems; si ninguno cubre todo, el de mejor cobertura
 * con menor total. Además calcula la "mejor mezcla por ítem" (cada ítem
 * adjudicado al proveedor más barato) como ahorro alternativo.
 *
 * Función pura: se usa tanto en el detalle (datos guardados) como en el
 * builder (estado en vivo).
 */

export interface AnalisisCelda {
  precioUnitario: number;
  noMenciona: boolean;
}

export interface AnalisisItemInput {
  descripcion: string;
  cantidad: number;
  /** Alineado por índice con columnas. */
  precios: AnalisisCelda[];
}

export interface AnalisisInput {
  columnas: { proveedorNombre: string }[];
  items: AnalisisItemInput[];
}

export interface ProveedorAnalisis {
  index: number;
  proveedorNombre: string;
  total: number;
  itemsCotizados: number;
  itemsTotal: number;
  cobertura: number; // 0..1
  completo: boolean;
  faltantes: string[];
}

export interface MejorMezcla {
  total: number;
  porItem: {
    descripcion: string;
    proveedorNombre: string | null;
    proveedorIndex: number | null;
    total: number;
  }[];
  itemsSinCotizar: string[];
}

export interface Recomendacion {
  tipo: 'COMPLETA' | 'PARCIAL' | 'NINGUNA';
  proveedorIndex: number | null;
  proveedorNombre: string | null;
  razones: string[];
  ahorroVsSiguiente: number | null;
  ahorroVsMezcla: number | null;
}

export interface CuadroAnalisis {
  proveedores: ProveedorAnalisis[];
  mejorMezcla: MejorMezcla;
  recomendacion: Recomendacion;
}

function celdaTotal(celda: AnalisisCelda | undefined, cantidad: number) {
  if (!celda || celda.noMenciona) return null;
  return (Number(celda.precioUnitario) || 0) * (Number(cantidad) || 0);
}

export function analizarCuadro(input: AnalisisInput): CuadroAnalisis {
  const { columnas, items } = input;
  const itemsTotal = items.length;

  const proveedores: ProveedorAnalisis[] = columnas.map((col, ci) => {
    let total = 0;
    let itemsCotizados = 0;
    const faltantes: string[] = [];

    for (const item of items) {
      const t = celdaTotal(item.precios[ci], item.cantidad);
      if (t === null) {
        faltantes.push(item.descripcion);
      } else {
        total += t;
        itemsCotizados += 1;
      }
    }

    const cobertura = itemsTotal === 0 ? 0 : itemsCotizados / itemsTotal;

    return {
      index: ci,
      proveedorNombre: col.proveedorNombre,
      total,
      itemsCotizados,
      itemsTotal,
      cobertura,
      completo: itemsTotal > 0 && itemsCotizados === itemsTotal,
      faltantes,
    };
  });

  // Mejor mezcla por ítem (cada ítem al proveedor más barato que lo cotiza)
  const porItem = items.map((item) => {
    let mejor: { index: number; nombre: string; total: number } | null = null;
    columnas.forEach((col, ci) => {
      const t = celdaTotal(item.precios[ci], item.cantidad);
      if (t !== null && (mejor === null || t < mejor.total)) {
        mejor = { index: ci, nombre: col.proveedorNombre, total: t };
      }
    });
    return {
      descripcion: item.descripcion,
      proveedorNombre: mejor ? mejor.nombre : null,
      proveedorIndex: mejor ? mejor.index : null,
      total: mejor ? mejor.total : 0,
    };
  });

  const mejorMezcla: MejorMezcla = {
    total: porItem.reduce((acc, p) => acc + p.total, 0),
    porItem,
    itemsSinCotizar: porItem
      .filter((p) => p.proveedorIndex === null)
      .map((p) => p.descripcion),
  };

  // Recomendación
  const recomendacion = recomendar(proveedores, mejorMezcla, itemsTotal);

  return { proveedores, mejorMezcla, recomendacion };
}

function recomendar(
  proveedores: ProveedorAnalisis[],
  mejorMezcla: MejorMezcla,
  itemsTotal: number
): Recomendacion {
  const conCotizacion = proveedores.filter((p) => p.itemsCotizados > 0);

  if (itemsTotal === 0 || conCotizacion.length === 0) {
    return {
      tipo: 'NINGUNA',
      proveedorIndex: null,
      proveedorNombre: null,
      razones: ['No hay precios suficientes para generar una recomendación.'],
      ahorroVsSiguiente: null,
      ahorroVsMezcla: null,
    };
  }

  const completos = conCotizacion
    .filter((p) => p.completo)
    .sort((a, b) => a.total - b.total);

  const fmt = (n: number) =>
    `Bs ${new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)}`;

  if (completos.length > 0) {
    const ganador = completos[0];
    const siguiente = completos[1];
    const ahorroVsSiguiente = siguiente
      ? siguiente.total - ganador.total
      : null;
    const ahorroVsMezcla = ganador.total - mejorMezcla.total;

    const razones = [
      `Cotiza los ${itemsTotal} ítems solicitados (cobertura completa).`,
      `Menor total entre proveedores con cobertura completa: ${fmt(ganador.total)}.`,
    ];
    if (ahorroVsSiguiente && ahorroVsSiguiente > 0 && siguiente) {
      razones.push(
        `Ahorro de ${fmt(ahorroVsSiguiente)} frente a ${siguiente.proveedorNombre}.`
      );
    }
    if (ahorroVsMezcla > 0) {
      razones.push(
        `Comprar por ítem al más barato ahorraría ${fmt(ahorroVsMezcla)} adicionales.`
      );
    }

    return {
      tipo: 'COMPLETA',
      proveedorIndex: ganador.index,
      proveedorNombre: ganador.proveedorNombre,
      razones,
      ahorroVsSiguiente,
      ahorroVsMezcla: ahorroVsMezcla > 0 ? ahorroVsMezcla : null,
    };
  }

  // Ninguno completo: mejor cobertura, desempate por menor total
  const ordenados = [...conCotizacion].sort((a, b) => {
    if (b.cobertura !== a.cobertura) return b.cobertura - a.cobertura;
    return a.total - b.total;
  });
  const ganador = ordenados[0];

  return {
    tipo: 'PARCIAL',
    proveedorIndex: ganador.index,
    proveedorNombre: ganador.proveedorNombre,
    razones: [
      `Ningún proveedor cotiza todos los ítems.`,
      `${ganador.proveedorNombre} tiene la mayor cobertura (${ganador.itemsCotizados}/${itemsTotal}) con menor total (${fmt(ganador.total)}).`,
      ganador.faltantes.length > 0
        ? `No cotiza: ${ganador.faltantes.join(', ')}.`
        : '',
      `Considera la mejor mezcla por ítem (${fmt(mejorMezcla.total)}) para cubrir lo faltante.`,
    ].filter(Boolean),
    ahorroVsSiguiente: null,
    ahorroVsMezcla: null,
  };
}
