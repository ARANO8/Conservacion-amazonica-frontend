'use client';

import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  FilePlus,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditTimelineProps {
  historial: AuditTimelineEvent[];
}

type AuditAccion =
  | 'CREADO'
  | 'DERIVADO'
  | 'APROBADO'
  | 'OBSERVADO'
  | 'RECHAZADO'
  | 'CORREGIDO';

interface AuditUsuario {
  id: number;
  nombreCompleto: string;
  rol?: string;
  cargo?: string;
}

export interface AuditTimelineEvent {
  id: number;
  accion: AuditAccion | string;
  comentario?: string | null;
  fecha: string;
  usuarioId: number;
  derivadoAId?: number | null;
  solicitudId?: number | null;
  rendicionId?: number | null;
  usuario?: AuditUsuario | null;
  derivadoA?: AuditUsuario | null;
}

function formatAuditDateTime(value: string): string {
  try {
    return format(parseISO(value), 'dd/MM/yyyy HH:mm', { locale: es });
  } catch {
    return value;
  }
}

function getAccionUi(accion: string) {
  if (accion === 'CREADO') {
    return {
      label: 'Creado',
      icon: FilePlus,
      dotClass: 'bg-blue-100 text-blue-700 border-blue-200',
    };
  }

  if (accion === 'DERIVADO') {
    return {
      label: 'Derivado',
      icon: ArrowRight,
      dotClass: 'bg-violet-100 text-violet-700 border-violet-200',
    };
  }

  if (accion === 'APROBADO') {
    return {
      label: 'Aprobado',
      icon: CheckCircle,
      dotClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
  }

  if (accion === 'OBSERVADO') {
    return {
      label: 'Observado',
      icon: AlertCircle,
      dotClass: 'bg-amber-100 text-amber-700 border-amber-200',
    };
  }

  if (accion === 'CORREGIDO') {
    return {
      label: 'Corregido',
      icon: RefreshCw,
      dotClass: 'bg-sky-100 text-sky-700 border-sky-200',
    };
  }

  return {
    label: 'Rechazado',
    icon: XCircle,
    dotClass: 'bg-rose-100 text-rose-700 border-rose-200',
  };
}

export function AuditTimeline({ historial }: AuditTimelineProps) {
  if (!historial || historial.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aún no hay eventos registrados en el historial.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {historial.map((evento, index) => {
        const ui = getAccionUi(evento.accion);
        const Icon = ui.icon;
        const esUltimo = index === historial.length - 1;

        return (
          <div key={evento.id} className="relative pl-12">
            {!esUltimo && (
              <span className="bg-border absolute top-10 left-[1.18rem] h-[calc(100%-1.2rem)] w-px" />
            )}

            <span
              className={`absolute top-0 left-0 flex h-9 w-9 items-center justify-center rounded-full border ${ui.dotClass}`}
            >
              <Icon className="h-4 w-4" />
            </span>

            <div className="rounded-lg border p-3">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold uppercase">{ui.label}</p>
                <p className="text-muted-foreground text-xs">
                  {formatAuditDateTime(evento.fecha)}
                </p>
              </div>

              <p className="text-sm">
                <span className="font-medium">
                  {evento.usuario?.nombreCompleto ||
                    `Usuario #${evento.usuarioId}`}
                </span>
                {evento.derivadoA ? (
                  <>
                    {' '}
                    derivó a{' '}
                    <span className="font-medium">
                      {evento.derivadoA.nombreCompleto}
                    </span>
                  </>
                ) : null}
              </p>

              {evento.comentario ? (
                <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                  {evento.comentario}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
