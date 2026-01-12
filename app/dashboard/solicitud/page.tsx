'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import SolicitudItems from '@/components/solicitudes/solicitud-items';
import SolicitudViajeItems from '@/components/solicitudes/solicitud-viaje-items';
import api from '@/lib/api';
import { toast } from 'sonner';

// Esquema Zod
const schema = z.object({
  // Campos visuales (No se envían directamente al DTO, se concatenan en description)
  destinatario: z.string().optional(),
  via: z.string().optional(),
  interino: z.boolean().optional(),
  copia: z.string().optional(),
  desembolso: z.string().optional(),
  proyecto: z.string().optional(),
  codigoPOA: z.string().optional(),
  codigoProyecto: z.string().optional(),
  lugarViaje: z.string().optional(),
  fechaViaje: z.string().optional(),
  lugarSolicitud: z.string().optional(),
  fechaSolicitud: z.string().optional(),
  solicitante: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),

  // Tabla 1: Conceptos de Viaje (Visual)
  viaticos: z
    .array(
      z.object({
        concepto: z.string().optional(),
        ciudad: z.string().optional(),
        destino: z.string().optional(),
        tipo: z.string().optional(),
        dias: z.number().optional(),
        personas: z.number().optional(),
      })
    )
    .optional(),

  // Campos del Backend
  motivo: z.string().min(1, 'El motivo es requerido'),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'El concepto es requerido'),
        budgetLineId: z.string().min(1, 'Partida requerida'),
        financingSourceId: z.string().min(1, 'Fuente requerida'),
        docum: z.string().optional(),
        tipo: z.string().optional(),
        amount: z.number().min(0, 'Monto inválido'),
        quantity: z.number().min(0).optional(),
        unitCost: z.number().min(0).optional(),
      })
    )
    .min(1, 'Debes agregar al menos un ítem'),
});

export type FormData = z.infer<typeof schema>;

export default function SolicitudPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<{
    budgetLines: { id: number; code: string; name: string }[];
    financingSources: { id: number; code: string; name: string }[];
  }>({
    budgetLines: [],
    financingSources: [],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      interino: false,
      items: [
        {
          description: 'Gasto',
          budgetLineId: '',
          financingSourceId: '1' /* Default ID for now */,
          amount: 0,
          quantity: 1,
          unitCost: 0,
        },
      ],
      viaticos: [],
      // Valores por defecto para selects visuales
      destinatario: 'director',
      via: 'director-programa',
      copia: 'abraham',
      desembolso: 'abraham',
      proyecto: 'aaf',
      solicitante: 'usuario',
      fechaInicio: '',
      fechaFin: '',
      codigoPOA: '',
      codigoProyecto: '',
      lugarViaje: '',
      fechaViaje: '',
      lugarSolicitud: 'La Paz',
      fechaSolicitud: new Date().toISOString().split('T')[0],
      motivo: '',
    },
  });

  useEffect(() => {
    const fetchOptions = async () => {
      const MOCK_BUDGET_LINES = [
        { id: 1, code: '30000', name: 'Pasajes y Viáticos' },
        { id: 2, code: '40000', name: 'Materiales' },
      ];
      const MOCK_FINANCING_SOURCES = [
        { id: 1, code: '001', name: 'Recursos Propios' },
        { id: 2, code: '002', name: 'Donación Externa' },
      ];

      try {
        const [blRes, fsRes] = await Promise.allSettled([
          api.get('/budget-lines'),
          api.get('/financing-sources'),
        ]);

        const budgetLines =
          blRes.status === 'fulfilled' &&
          Array.isArray(blRes.value.data) &&
          blRes.value.data.length > 0
            ? blRes.value.data
            : MOCK_BUDGET_LINES;

        const financingSources =
          fsRes.status === 'fulfilled' &&
          Array.isArray(fsRes.value.data) &&
          fsRes.value.data.length > 0
            ? fsRes.value.data
            : MOCK_FINANCING_SOURCES;

        setOptions({
          budgetLines,
          financingSources,
        });
      } catch (error) {
        console.error('Error fetching options, using mocks', error);
        setOptions({
          budgetLines: MOCK_BUDGET_LINES,
          financingSources: MOCK_FINANCING_SOURCES,
        });
      }
    };
    fetchOptions();
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Construir descripción concatenada
      const descriptionHeader = `
SOLICITUD DE FONDOS
Lugar: ${data.lugarViaje || 'N/A'}
Fecha: ${data.fechaViaje || 'N/A'}
POA: ${data.codigoPOA || ''}
Proyecto: ${data.codigoProyecto || ''}
--------------------------------
Viáticos:
${data.viaticos?.map((v) => `- ${v.concepto} (${v.ciudad}): ${v.dias} días`).join('\n') || 'Ninguno'}
--------------------------------
${data.motivo}
      `.trim();

      const payload = {
        description: descriptionHeader,
        items: data.items.map((item) => ({
          description:
            item.description ||
            `${item.docum || ''} ${item.tipo || ''}`.trim() ||
            'Gasto',
          budgetLineId: Number(item.budgetLineId),
          financingSourceId: Number(item.financingSourceId) || 1, // Defaulting to 1 if not selected, as we removed the column visual but backend needs it
          amount: Number(item.amount),
        })),
        // Total calculado automáticamente en backend, pero si se requiere enviar:
        totalAmount: data.items.reduce(
          (acc, curr) => acc + (Number(curr.amount) || 0),
          0
        ),
      };

      await api.post('/requests', payload);

      toast.success('Solicitud creada', {
        description: 'La solicitud ha sido enviada exitosamente.',
      });

      router.push('/dashboard/solicitudes');
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Error', {
        description: 'No se pudo crear la solicitud. Intente nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex-1 space-y-6 p-4 pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FieldGroup>
              <FieldSet>
                <FieldLegend>Datos de Destinatario</FieldLegend>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="destinatario"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>A:</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona destinatario" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="director">
                              Marcos F. Terán Valenzuela
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="via"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Vía:</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona vía" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="director-programa">
                              Daniel Marcelo Larrea Alcázar
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="solicitante"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>De (Solicitante):</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona solicitante" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usuario">
                              Usuario Actual
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interino"
                    render={({ field }) => (
                      <Field className="flex items-end gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            id="interino"
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="border-input bg-background size-4 border"
                          />
                          <label htmlFor="interino" className="text-sm">
                            Interino
                          </label>
                        </div>
                      </Field>
                    )}
                  />
                </div>
              </FieldSet>

              <Separator />

              <FieldSet>
                <FieldLegend>Proyecto y Responsables</FieldLegend>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="copia"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Ref (Copia):</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona copia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="abraham">
                              ABRAHAM SALOMÓN POMA
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="desembolso"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Desembolso a Nombre De:</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona persona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="abraham">
                              ABRAHAM SALOMÓN POMA
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proyecto"
                    render={({ field }) => (
                      <Field className="md:col-span-2">
                        <FieldLabel>Proyecto / Actividad POA:</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona proyecto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aaf">
                              AAF FORTALECIMIENTO
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                </div>
              </FieldSet>

              <Separator />

              <FieldSet>
                <FieldLegend>Información del Viaje/Taller</FieldLegend>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="codigoPOA"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Código de Actividad POA</FieldLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej. 32113" />
                        </FormControl>
                      </Field>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="codigoProyecto"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Código de Actividad Proyecto</FieldLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej. A.133" />
                        </FormControl>
                      </Field>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lugarViaje"
                    render={({ field }) => (
                      <Field className="md:col-span-2">
                        <FieldLabel>Lugar(es) de Viaje y/o Taller</FieldLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej. La Paz, Cobija" />
                        </FormControl>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fechaViaje"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Fecha viaje y/o Taller</FieldLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="motivo"
                    render={({ field }) => (
                      <Field className="md:col-span-2">
                        <FieldLabel>
                          Motivo del Viaje y/o Taller{' '}
                          <span className="text-red-500">*</span>
                        </FieldLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Descripción detallada del motivo"
                          />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="fechaInicio"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Fecha Inicio</FieldLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </Field>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fechaFin"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Fecha Fin</FieldLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </Field>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="lugarSolicitud"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Lugar de Solicitud</FieldLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej. La Paz" />
                        </FormControl>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fechaSolicitud"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Fecha Solicitud</FieldLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </Field>
                    )}
                  />
                </div>
              </FieldSet>

              <Separator />

              <FieldSet>
                <FieldLegend>Conceptos de Viaje</FieldLegend>
                <SolicitudViajeItems control={form.control} />
              </FieldSet>

              <Separator />

              <FieldSet>
                <FieldLegend>
                  Conceptos (detalle) <span className="text-red-500">*</span>
                </FieldLegend>
                <div className="p-1">
                  {form.formState.errors.items?.root && (
                    <p className="text-destructive mb-2 text-sm font-medium">
                      {form.formState.errors.items.root.message}
                    </p>
                  )}
                  {form.formState.errors.items &&
                    !form.formState.errors.items.root && (
                      <p className="text-destructive mb-2 text-sm font-medium">
                        Revisa los errores en los ítems.
                      </p>
                    )}
                  <SolicitudItems
                    control={form.control}
                    watch={form.watch}
                    budgetLines={options.budgetLines}
                    financingSources={options.financingSources}
                  />
                </div>
              </FieldSet>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => console.log('Guardar Borrador')}
                >
                  Guardar Borrador
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Solicitud'}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </Form>
      </div>
    </div>
  );
}
