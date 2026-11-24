'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  ArrowLeft,
  CheckCircle,
  FileDown,
  Loader2,
  MessageSquareWarning,
  Pencil,
  Receipt,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ObservacionAlert } from '@/components/shared/observacion-alert';
import { DocumentoViewer } from '@/components/shared/documento-viewer';
import {
  LiquidacionViaticosEstadoBadge,
  liquidacionEditable,
} from '@/components/liquidaciones-viaticos/liquidacion-viaticos-estado';
import { liquidacionesViaticosService } from '@/lib/services/liquidaciones-viaticos-service';
import { downloadBlob } from '@/lib/utils/download-blob';
import { cn, formatMoney } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import type { LiquidacionViaticosResponse } from '@/types/liquidacion-viaticos-backend';

type Accion = 'enviar' | 'revisar' | 'observar' | 'pdf';

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    const { message } = error.response.data;
    return Array.isArray(message) ? message.join('. ') : String(message);
  }
  return porDefecto;
}

export default function DetalleLiquidacionViaticosPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const usuario = useAuthStore((state) => state.user);
  const [liquidacion, setLiquidacion] =
    useState<LiquidacionViaticosResponse | null>(null);
  /** null = todas las hojas del viaje */
  const [hojaId, setHojaId] = useState<number | null>(null);
  const [accion, setAccion] = useState<Accion | null>(null);
  const [observarAbierto, setObservarAbierto] = useState(false);
  const [motivo, setMotivo] = useState('');

  const cargar = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLiquidacion(
          await liquidacionesViaticosService.getById(params.id, signal)
        );
      } catch {
        if (signal?.aborted) return;
        toast.error('No se pudo cargar la liquidación de viáticos.');
        router.push('/app/liquidaciones-viaticos');
      }
    },
    [params.id, router]
  );

  useEffect(() => {
    const controller = new AbortController();
    void cargar(controller.signal);
    return () => controller.abort();
  }, [cargar]);

  if (!liquidacion) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="text-primary size-10 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          Cargando liquidación de viáticos...
        </span>
      </div>
    );
  }

  const miId = String(usuario?.id ?? '');
  const esAutor = String(liquidacion.usuarioId) === miId;
  const puedeRevisar =
    liquidacion.estado === 'ENVIADO' &&
    (String(liquidacion.directorProgramaId) === miId ||
      usuario?.rol === 'ADMIN');
  const hoja = liquidacion.hojas.find((h) => h.id === hojaId) ?? null;
  const totalAPagar = liquidacion.hojas.reduce(
    (t, h) => t + Number(h.totalLiquido),
    0
  );

  const ejecutar = async (
    tipo: Exclude<Accion, 'pdf'>,
    fn: () => Promise<LiquidacionViaticosResponse>,
    exito: string
  ) => {
    setAccion(tipo);
    try {
      setLiquidacion(await fn());
      toast.success(exito);
      return true;
    } catch (error: unknown) {
      toast.error(mensajeDeError(error, 'No se pudo completar la acción.'));
      return false;
    } finally {
      setAccion(null);
    }
  };

  const descargar = async () => {
    setAccion('pdf');
    try {
      await downloadBlob(
        () =>
          liquidacionesViaticosService.downloadPdf(liquidacion.id, hoja?.id),
        hoja
          ? `ANEXO5-${liquidacion.codigoLiquidacion}-${hoja.orden + 1}`
          : `ANEXO5-${liquidacion.codigoLiquidacion}`,
        {
          errorMessage: 'No se pudo descargar el PDF de la liquidación.',
          successMessage: 'PDF de la liquidación descargado.',
        }
      );
    } finally {
      setAccion(null);
    }
  };

  const confirmarObservacion = async () => {
    if (!motivo.trim()) {
      toast.error('Escribe el motivo de la observación.');
      return;
    }
    const ok = await ejecutar(
      'observar',
      () =>
        liquidacionesViaticosService.observar(liquidacion.id, motivo.trim()),
      'Liquidación observada. Se notificó al autor.'
    );
    if (ok) {
      setObservarAbierto(false);
      setMotivo('');
    }
  };

  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/liquidaciones-viaticos">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a liquidaciones de viáticos</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Receipt className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="flex items-center gap-2 text-lg leading-tight font-bold">
              {liquidacion.codigoLiquidacion}
              <LiquidacionViaticosEstadoBadge estado={liquidacion.estado} />
            </h1>
            <p className="text-muted-foreground text-xs">
              Liquidación de Viáticos (ANEXO 5)
              {liquidacion.solicitud && (
                <>
                  {' — '}
                  <Link
                    href={`/app/solicitudes/${liquidacion.solicitud.id}`}
                    className="font-mono hover:underline"
                  >
                    {liquidacion.solicitud.codigoSolicitud}
                  </Link>
                </>
              )}
              {' — '}
              {formatMoney(totalAPagar)} a pagar
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={accion === 'pdf'}
            onClick={descargar}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {accion === 'pdf'
              ? 'Generando...'
              : hoja
                ? 'Descargar PDF de la persona'
                : 'Descargar PDF'}
          </Button>
          {esAutor && liquidacionEditable(liquidacion) && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/app/liquidaciones-viaticos/${liquidacion.id}/editar`}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <Button
                size="sm"
                disabled={!!accion}
                onClick={() =>
                  ejecutar(
                    'enviar',
                    () => liquidacionesViaticosService.enviar(liquidacion.id),
                    'Liquidación enviada al Director de Programa.'
                  )
                }
              >
                <Send className="mr-2 h-4 w-4" />
                {accion === 'enviar' ? 'Enviando...' : 'Enviar a revisión'}
              </Button>
            </>
          )}
          {puedeRevisar && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={!!accion}
                onClick={() => setObservarAbierto(true)}
              >
                <MessageSquareWarning className="mr-2 h-4 w-4" />
                Observar
              </Button>
              <Button
                size="sm"
                disabled={!!accion}
                onClick={() =>
                  ejecutar(
                    'revisar',
                    () => liquidacionesViaticosService.revisar(liquidacion.id),
                    'Liquidación revisada. Se notificó al autor.'
                  )
                }
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {accion === 'revisar' ? 'Guardando...' : 'Dar por revisada'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4 p-6">
        {liquidacion.estado === 'OBSERVADO' && (
          <ObservacionAlert
            titulo="Liquidación observada por el Director de Programa"
            observacion={liquidacion.observacion}
          />
        )}

        {liquidacion.estado === 'ENVIADO' && esAutor && (
          <p className="bg-muted rounded-md border px-3 py-2 text-sm">
            La liquidación está esperando la revisión de{' '}
            <strong>{liquidacion.directorPrograma?.nombreCompleto}</strong>.
          </p>
        )}

        {liquidacion.estado === 'REVISADO' && esAutor && (
          <p className="bg-muted rounded-md border px-3 py-2 text-sm">
            Revisada: ya puedes importarla como gastos LV en la rendición de{' '}
            {liquidacion.solicitud?.codigoSolicitud ?? 'la solicitud'}.
          </p>
        )}

        {liquidacion.hojas.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={hojaId === null ? 'default' : 'outline'}
              onClick={() => setHojaId(null)}
            >
              Todas las hojas
            </Button>
            {liquidacion.hojas.map((h) => (
              <Button
                key={h.id}
                size="sm"
                variant={hojaId === h.id ? 'default' : 'outline'}
                onClick={() => setHojaId(h.id)}
              >
                {h.usuario.nombreCompleto}
                <span
                  className={cn(
                    'ml-2 text-xs tabular-nums',
                    hojaId === h.id ? 'opacity-80' : 'text-muted-foreground'
                  )}
                >
                  {formatMoney(h.totalLiquido)}
                </span>
              </Button>
            ))}
          </div>
        )}

        <DocumentoViewer
          titulo={
            hoja
              ? `Anexo 5 — ${hoja.usuario.nombreCompleto}`
              : 'Anexo 5 — Liquidación de Viáticos'
          }
          ruta={
            hoja
              ? `/liquidaciones-viaticos/${liquidacion.id}/hojas/${hoja.id}/documento`
              : `/liquidaciones-viaticos/${liquidacion.id}/documento`
          }
          recargarCon={liquidacion.updatedAt}
        />
      </div>

      <Dialog open={observarAbierto} onOpenChange={setObservarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Observar la liquidación {liquidacion.codigoLiquidacion}
            </DialogTitle>
            <DialogDescription>
              La liquidación vuelve a su autor con tu motivo para que la corrija
              y la reenvíe.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: El retorno fue a media tarde, corresponde medio viático"
            className="min-h-28"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setObservarAbierto(false)}
              disabled={accion === 'observar'}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarObservacion}
              disabled={accion === 'observar'}
            >
              {accion === 'observar' ? 'Enviando...' : 'Observar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
