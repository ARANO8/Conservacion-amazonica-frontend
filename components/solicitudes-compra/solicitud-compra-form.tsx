'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ShoppingCart,
  ArrowLeft,
  Loader2,
  SendHorizonal,
} from 'lucide-react';

import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { formatMoney } from '@/lib/utils';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { catalogosService } from '@/lib/services/catalogos-service';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import type { PoaStructureItem } from '@/types/backend';
import type { PoaLookup } from '@/types/catalogs';
import {
  solicitudCompraSchema,
  type SolicitudCompraFormData,
} from './solicitud-compra-schema';
import CompraReviewModal from './compra-review-modal';
import { PoaSelectorCascade } from './poa-selector-cascade';
import { SolicitudCompraItemsTable } from './solicitud-compra-items-table';

interface UsuarioOption {
  id: number;
  nombreCompleto: string;
  rol: string;
  cargo?: string;
}

const emptyItem = {
  descripcion: '',
  cantidad: 1,
  uso: '',
  costoUnitario: 0,
};

interface Props {
  solicitudId?: number;
  initialValues?: Partial<SolicitudCompraFormData>;
  initialPoaCode?: string;
}

export default function SolicitudCompraForm({
  solicitudId,
  initialValues,
  initialPoaCode,
}: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isEdit = typeof solicitudId === 'number';

  // ---- Options loading ----
  const [usuarioOptions, setUsuarioOptions] = useState<UsuarioOption[]>([]);
  const [poaCodes, setPoaCodes] = useState<PoaLookup[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(true);

  // ---- Review modal ----
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // States from cascade selection needed for review modal
  const [selectedPoaCode, setSelectedPoaCode] = useState('');
  const [selectedPoaItem, setSelectedPoaItem] = useState<PoaStructureItem | undefined>(undefined);

  const form = useForm<SolicitudCompraFormData>({
    resolver: zodResolver(solicitudCompraSchema),
    defaultValues: {
      aprobadorId: initialValues?.aprobadorId ?? 0,
      poaId: initialValues?.poaId ?? 0,
      motivoSolicitud: initialValues?.motivoSolicitud ?? '',
      proyecto: initialValues?.proyecto ?? '',
      chequeANombreDe:
        initialValues?.chequeANombreDe ?? user?.nombreCompleto ?? '',
      descripcion: initialValues?.descripcion ?? '',
      items:
        initialValues?.items && initialValues.items.length > 0
          ? initialValues.items
          : [{ ...emptyItem }],
    },
    mode: 'onBlur',
  });

  // Reset cuando llegan initialValues (modo edición)
  useEffect(() => {
    if (initialValues) {
      form.reset({
        aprobadorId: initialValues.aprobadorId ?? 0,
        poaId: initialValues.poaId ?? 0,
        motivoSolicitud: initialValues.motivoSolicitud ?? '',
        proyecto: initialValues.proyecto ?? '',
        chequeANombreDe:
          initialValues.chequeANombreDe ?? user?.nombreCompleto ?? '',
        descripcion: initialValues.descripcion ?? '',
        items:
          initialValues.items && initialValues.items.length > 0
            ? initialValues.items
            : [{ ...emptyItem }],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchedItems = useWatch({ control: form.control, name: 'items' });

  const total = useMemo(
    () =>
      (watchedItems ?? []).reduce((acc, item) => {
        return (
          acc +
          (Number(item?.cantidad) || 0) * (Number(item?.costoUnitario) || 0)
        );
      }, 0),
    [watchedItems]
  );

  // ---- Carga inicial de opciones ----
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoadingOpts(true);
        const [usuariosRes, codes] = await Promise.all([
          api.get<UsuarioOption[]>('/usuarios/lookup/activos', { signal: controller.signal }),
          catalogosService.getPoaLookup(controller.signal),
        ]);
        setUsuarioOptions(usuariosRes.data.filter((u) => String(u.id) !== String(user?.id)));
        setPoaCodes(codes);
      } catch (err) {
        if (axios.isCancel(err)) return;
        toast.error('No se pudieron cargar las opciones del formulario.');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingOpts(false);
        }
      }
    };
    void load();
    return () => {
      controller.abort();
    };
  }, [user?.id]);

  // ---- Abrir modal (valida campos del form body antes de abrir) ----
  const handleOpenReview = async () => {
    const isValid = await form.trigger(['poaId', 'motivoSolicitud', 'items']);
    if (isValid) {
      setIsReviewOpen(true);
    }
  };

  // ---- Payload y submit ----
  const buildPayload = (data: SolicitudCompraFormData) => ({
    tipo: 'COMPRA_SERVICIO' as const,
    poaIds: [data.poaId],
    aprobadorId: data.aprobadorId,
    motivoViaje: data.motivoSolicitud,
    proyecto: data.proyecto || undefined,
    chequeANombreDe: data.chequeANombreDe,
    descripcion: data.descripcion || undefined,
    gastosCompra: data.items.map((item) => ({
      descripcion: item.descripcion,
      cantidad: Number(item.cantidad),
      uso: item.uso || undefined,
      costoUnitario: Number(item.costoUnitario),
      poaId: data.poaId,
    })),
    planificaciones: [] as [],
    viaticos: [] as [],
    gastos: [] as [],
    nominasTerceros: [] as [],
    hospedajes: [] as [],
  });

  const onSubmit = async (data: SolicitudCompraFormData) => {
    try {
      setSubmitting(true);
      if (isEdit && solicitudId !== undefined) {
        await solicitudesService.updateSolicitud(
          solicitudId,
          buildPayload(data)
        );
        toast.success('Solicitud actualizada correctamente.');
      } else {
        await solicitudesService.createSolicitudCompra(buildPayload(data));
        toast.success('Solicitud de fondos registrada correctamente.');
      }
      setIsReviewOpen(false);
      router.push('/app/solicitudes-compra');
      router.refresh();
    } catch (error: unknown) {
      const mensaje =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo guardar la solicitud. Intente nuevamente.';
      toast.error(mensaje);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden">
      {/* Sticky Header */}
      <div className="shrink-0 border-b p-4 px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-primary h-5 w-5 shrink-0" />
            <div>
              <h1 className="text-lg leading-tight font-bold">
                {isEdit
                  ? 'Editar Solicitud de Fondos'
                  : 'Nueva Solicitud de Fondos'}
              </h1>
              <p className="text-muted-foreground text-xs">
                Compras y Servicios — ANEXO 3
              </p>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* Área scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <form
              id="solicitud-compra-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="animate-in fade-in duration-500">
                <FieldGroup>
                  {/* ---- Sección 1: Información General ---- */}
                  <FieldSet>
                    <FieldLegend>
                      Información General de la Solicitud
                    </FieldLegend>
                    <FormField
                      control={form.control}
                      name="motivoSolicitud"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>
                            MOTIVO DE SOLICITUD:{' '}
                            <span className="text-destructive">*</span>
                          </FieldLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej. TALLER POA 2026"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </Field>
                      )}
                    />
                  </FieldSet>

                  <Separator />

                  {/* ---- Sección 2: Partida Presupuestaria ---- */}
                  <FieldSet>
                    <FieldLegend>Partida Presupuestaria</FieldLegend>
                    <PoaSelectorCascade
                      form={form}
                      poaCodes={poaCodes}
                      initialValues={initialValues}
                      initialPoaCode={initialPoaCode}
                      onPoaChange={(code, item) => {
                        setSelectedPoaCode(code);
                        setSelectedPoaItem(item);
                      }}
                    />
                  </FieldSet>

                  <Separator />

                  {/* ---- Sección 3: Descripción del Gasto ---- */}
                  <SolicitudCompraItemsTable />

                  <Separator />

                  {/* ---- Sección 4: Observaciones ---- */}
                  <FieldSet>
                    <FieldLegend>Observaciones</FieldLegend>
                    <FormField
                      control={form.control}
                      name="descripcion"
                      render={({ field }) => (
                        <Field>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Observaciones adicionales..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </Field>
                      )}
                    />
                  </FieldSet>
                </FieldGroup>
              </div>
            </form>
          </div>

          {/* Sticky Footer */}
          <div className="bg-background z-50 shrink-0 border-t p-4 px-6 md:pb-6">
            <div className="flex w-full items-center justify-between">
              <div />
              <div className="flex items-center gap-6">
                <div className="flex flex-col text-right">
                  <span className="text-primary text-[10px] font-black tracking-tight uppercase">
                    Total Solicitado
                  </span>
                  <span className="text-primary text-xl font-black">
                    {formatMoney(total)}
                  </span>
                </div>

                <div className="bg-border h-8 w-[1px]" />

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/app/solicitudes-compra')}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  size="lg"
                  className="min-w-[160px] shadow-lg transition-all"
                  onClick={() => void handleOpenReview()}
                  disabled={loadingOpts}
                >
                  {loadingOpts ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      Revisar y Enviar
                      <SendHorizonal className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <CompraReviewModal
          isOpen={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          onConfirm={form.handleSubmit(onSubmit)}
          loading={submitting}
          usuarioOptions={usuarioOptions}
          selectedPoaCode={selectedPoaCode}
          selectedPoaItem={selectedPoaItem}
        />
      </Form>
    </div>
  );
}
