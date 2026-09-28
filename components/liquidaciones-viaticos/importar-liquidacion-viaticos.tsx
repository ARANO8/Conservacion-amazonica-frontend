'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Download, Receipt } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { LiquidacionViaticosEstadoBadge } from '@/components/liquidaciones-viaticos/liquidacion-viaticos-estado';
import { liquidacionesViaticosService } from '@/lib/services/liquidaciones-viaticos-service';
import { formatMoney } from '@/lib/utils';
import type { GastoRendicion } from '@/types/rendicion-schema';
import type { GastosLvResponse } from '@/types/liquidacion-viaticos-backend';
import type { SolicitudResponse } from '@/types/solicitud-backend';

interface ImportarLiquidacionViaticosProps {
  solicitud: Pick<
    SolicitudResponse,
    'id' | 'tipo' | 'codigoSolicitud' | 'liquidacionViaticos'
  > | null;
  /** Gastos ya cargados en la rendición, para no duplicar hojas */
  gastos: GastoRendicion[];
  onImportar: (gastos: GastoRendicion[]) => void;
}

/**
 * La Liquidación de Viáticos (ANEXO 5) del viaje dentro de la rendición: con
 * la liquidación revisada, sus hojas entran como gastos LV (una por persona y
 * partida). Sin ella, solo avisa; la rendición puede seguir igual.
 */
export function ImportarLiquidacionViaticos({
  solicitud,
  gastos,
  onImportar,
}: ImportarLiquidacionViaticosProps) {
  const [datos, setDatos] = useState<GastosLvResponse | null>(null);
  const esViaje = !!solicitud && solicitud.tipo !== 'COMPRA_SERVICIO';
  const solicitudId = solicitud?.id;

  useEffect(() => {
    if (!esViaje || !solicitudId) return;
    const controller = new AbortController();
    liquidacionesViaticosService
      .getGastosLv(solicitudId, controller.signal)
      .then(setDatos)
      .catch(() => {
        if (!controller.signal.aborted) setDatos(null);
      });
    return () => controller.abort();
  }, [esViaje, solicitudId]);

  if (!esViaje || !solicitud || !datos) return null;

  const liquidacion =
    solicitud.liquidacionViaticos && !solicitud.liquidacionViaticos.deletedAt
      ? solicitud.liquidacionViaticos
      : null;

  if (!datos.estado) {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Falta la <strong>liquidación de viáticos</strong> (ANEXO 5) de la
            solicitud {solicitud.codigoSolicitud}. Con ella revisada, los
            viáticos se cargan solos como gastos LV.
          </span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/app/liquidaciones-viaticos/nueva?solicitudId=${solicitud.id}`}
          >
            Crear liquidación
          </Link>
        </Button>
      </div>
    );
  }

  const yaImportadas = new Set(
    gastos.map((g) => g.hojaLiquidacionId).filter(Boolean)
  );
  const pendientes = datos.gastos.filter(
    (g) => !yaImportadas.has(g.hojaLiquidacionId)
  );
  const total = datos.gastos.reduce((t, g) => t + g.montoNeto, 0);

  const importar = () => {
    onImportar(
      pendientes.map((g) => ({
        hojaLiquidacionId: g.hojaLiquidacionId,
        concepto: g.concepto,
        detalle: g.detalle,
        tipoDocumento: 'LV',
        numeroDocumento: g.numeroDocumento,
        proveedor: g.proveedor,
        fechaDocumento: g.fechaDocumento.slice(0, 10),
        partidaId: g.partidaId,
        // La tabla parte del líquido y recalcula el bruto con el factor LV
        montoTotal: g.montoNeto,
        montoNeto: g.montoNeto,
        montoBruto: g.montoBruto,
        montoImpuestos: g.montoImpuestos,
        estado: 'PENDIENTE',
      }))
    );
    toast.success(
      `${pendientes.length} gasto(s) LV importados de la liquidación de viáticos.`
    );
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Receipt className="text-primary h-4 w-4 shrink-0" />
        <span>
          Liquidación de viáticos{' '}
          {liquidacion && (
            <span className="font-mono font-semibold">
              {liquidacion.codigoLiquidacion}
            </span>
          )}
        </span>
        <LiquidacionViaticosEstadoBadge estado={datos.estado} />
        {datos.estado === 'REVISADO' ? (
          <span className="text-muted-foreground text-xs">
            {formatMoney(total)} a pagar ·{' '}
            {pendientes.length === 0
              ? 'ya importada'
              : `${pendientes.length} gasto(s) LV por importar`}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">
            Se podrá importar cuando el Director de Programa la revise.
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {liquidacion && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/app/liquidaciones-viaticos/${liquidacion.id}`}>
              Ver ANEXO 5
            </Link>
          </Button>
        )}
        {datos.estado === 'REVISADO' && pendientes.length > 0 && (
          <Button type="button" size="sm" onClick={importar}>
            <Download className="mr-2 h-4 w-4" />
            Importar gastos LV
          </Button>
        )}
      </div>
    </div>
  );
}
