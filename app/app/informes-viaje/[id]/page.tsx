'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  FileDown,
  Loader2,
  MessageSquareWarning,
  Pencil,
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
  InformeViajeEstadoBadge,
  informeEditable,
} from '@/components/informes-viaje/informe-viaje-estado';
import { informesViajeService } from '@/lib/services/informes-viaje-service';
import { downloadBlob } from '@/lib/utils/download-blob';
import { useAuthStore } from '@/store/auth-store';
import type { InformeViajeResponse } from '@/types/informe-viaje-backend';

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    const { message } = error.response.data;
    return Array.isArray(message) ? message.join('. ') : String(message);
  }
  return porDefecto;
}

export default function DetalleInformeViajePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const usuario = useAuthStore((state) => state.user);
  const [informe, setInforme] = useState<InformeViajeResponse | null>(null);
  const [accion, setAccion] = useState<
    'enviar' | 'revisar' | 'observar' | 'pdf' | null
  >(null);
  const [observarAbierto, setObservarAbierto] = useState(false);
  const [motivo, setMotivo] = useState('');

  const cargar = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setInforme(await informesViajeService.getById(params.id, signal));
      } catch {
        if (signal?.aborted) return;
        toast.error('No se pudo cargar el informe de viaje.');
        router.push('/app/informes-viaje');
      }
    },
    [params.id, router]
  );

  useEffect(() => {
    const controller = new AbortController();
    void cargar(controller.signal);
    return () => controller.abort();
  }, [cargar]);

  if (!informe) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="text-primary size-10 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          Cargando informe de viaje...
        </span>
      </div>
    );
  }

  const miId = String(usuario?.id ?? '');
  const esAutor = String(informe.usuarioId) === miId;
  const puedeRevisar =
    informe.estado === 'ENVIADO' &&
    (String(informe.directorProgramaId) === miId || usuario?.rol === 'ADMIN');

  const ejecutar = async (
    tipo: 'enviar' | 'revisar' | 'observar',
    fn: () => Promise<InformeViajeResponse>,
    exito: string
  ) => {
    setAccion(tipo);
    try {
      setInforme(await fn());
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
        () => informesViajeService.downloadPdf(informe.id),
        `ANEXO7-${informe.codigoInforme}`,
        {
          errorMessage: 'No se pudo descargar el PDF del informe.',
          successMessage: 'PDF del informe de viaje descargado.',
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
      () => informesViajeService.observar(informe.id, motivo.trim()),
      'Informe observado. Se notificó al autor.'
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
          <Link href="/app/informes-viaje">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a informes de viaje</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <ClipboardList className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="flex items-center gap-2 text-lg leading-tight font-bold">
              {informe.codigoInforme}
              <InformeViajeEstadoBadge estado={informe.estado} />
            </h1>
            <p className="text-muted-foreground text-xs">
              Informe de Viaje (ANEXO 7)
              {informe.solicitud && (
                <>
                  {' — '}
                  <Link
                    href={`/app/solicitudes/${informe.solicitud.id}`}
                    className="font-mono hover:underline"
                  >
                    {informe.solicitud.codigoSolicitud}
                  </Link>
                </>
              )}
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
            {accion === 'pdf' ? 'Generando...' : 'Descargar PDF'}
          </Button>
          {esAutor && informeEditable(informe) && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/app/informes-viaje/${informe.id}/editar`}>
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
                    () => informesViajeService.enviar(informe.id),
                    'Informe enviado al Director de Programa.'
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
                    () => informesViajeService.revisar(informe.id),
                    'Informe revisado. Se notificó al autor.'
                  )
                }
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {accion === 'revisar' ? 'Guardando...' : 'Dar por revisado'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4 p-6">
        {informe.estado === 'OBSERVADO' && (
          <ObservacionAlert
            titulo="Informe observado por el Director de Programa"
            observacion={informe.observacion}
          />
        )}

        {informe.estado === 'ENVIADO' && esAutor && (
          <p className="bg-muted rounded-md border px-3 py-2 text-sm">
            El informe está esperando la revisión de{' '}
            <strong>{informe.directorPrograma?.nombreCompleto}</strong>.
          </p>
        )}

        <DocumentoViewer
          titulo="Anexo 7 — Informe de Viaje"
          ruta={`/informes-viaje/${informe.id}/documento`}
          recargarCon={informe.updatedAt}
        />
      </div>

      <Dialog open={observarAbierto} onOpenChange={setObservarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Observar el informe {informe.codigoInforme}
            </DialogTitle>
            <DialogDescription>
              El informe vuelve a su autor con tu motivo para que lo corrija y
              lo reenvíe.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Falta detallar la reunión con la alcaldía"
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
