import { useState, useEffect, useRef } from 'react';
import { Control, useFormContext, useWatch } from 'react-hook-form';
import { catalogosService } from '@/services/catalogos.service';
import { FormField, FormControl, FormMessage } from '@/components/ui/form';
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';

import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import SolicitudViaticos from '@/components/solicitudes/solicitud-viaticos';
import SolicitudGastos from '@/components/solicitudes/solicitud-gastos';
import { FormData } from '@/components/solicitudes/solicitud-schema';
import {
  Concepto,
  Grupo,
  Partida,
  TipoGasto,
  PoaLookup,
  Proyecto,
  CodigoPresupuestario,
} from '@/types/catalogs';
import { Loader2, Search } from 'lucide-react';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SolicitudEconomicaProps {
  control: Control<FormData>;
  watchActividades: FormData['actividades'];
  conceptos: Concepto[];
  grupos: Grupo[];
  partidas: Partida[];
  tiposGasto: TipoGasto[];
  poaCodes: PoaLookup[];
  onBudgetChange?: (monto: number) => void;
}

export default function SolicitudEconomica({
  control,
  watchActividades,
  conceptos,

  tiposGasto,
  poaCodes,
  onBudgetChange,
}: SolicitudEconomicaProps) {
  const { setValue } = useFormContext<FormData>();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [filteredGroups, setFilteredGroups] = useState<Grupo[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [partidasHeader, setPartidasHeader] = useState<Partida[]>([]);
  const [isLoadingPartidas, setIsLoadingPartidas] = useState(false);
  const [codigosPresupuestarios, setCodigosPresupuestarios] = useState<
    CodigoPresupuestario[]
  >([]);
  const [isLoadingCodigos, setIsLoadingCodigos] = useState(false);
  const [poaSearch, setPoaSearch] = useState('');
  const [isPoaOpen, setIsPoaOpen] = useState(false);

  const selectedPoa = useWatch({
    control,
    name: 'codigoPOA',
  });

  const selectedProyectoId = useWatch({
    control,
    name: 'proyecto',
  });

  const selectedGrupoId = useWatch({
    control,
    name: 'grupo',
  });

  const selectedPartidaId = useWatch({
    control,
    name: 'partida',
  });

  const selectedCodigoProyecto = useWatch({
    control,
    name: 'codigoProyecto',
  });

  useEffect(() => {
    const fetchGrupos = async () => {
      const proyectoId = Number(selectedProyectoId);

      // Resetear el valor de grupo de cabecera al cambiar de proyecto
      setValue('grupo', '');
      setValue('partida', '');
      setValue('codigoProyecto', '');
      setCodigosPresupuestarios([]);

      if (!proyectoId || isNaN(proyectoId)) {
        setFilteredGroups([]);
        return;
      }

      try {
        setIsLoadingGroups(true);
        const data = await catalogosService.getGruposByProyecto(proyectoId);
        setFilteredGroups(data);
      } catch (error) {
        console.error('Error fetching grupos:', error);
        setFilteredGroups([]);
      } finally {
        setIsLoadingGroups(false);
      }
    };

    fetchGrupos();
  }, [selectedProyectoId, setValue]);

  useEffect(() => {
    const fetchPartidas = async () => {
      const grupoId = Number(selectedGrupoId);

      // Resetear partida al cambiar de grupo
      setValue('partida', '');
      setValue('codigoProyecto', ''); // Reset siguiente nivel
      setCodigosPresupuestarios([]);

      if (!grupoId || isNaN(grupoId)) {
        setPartidasHeader([]);
        return;
      }

      try {
        setIsLoadingPartidas(true);
        const data = await catalogosService.getPartidasByGrupo(grupoId);
        setPartidasHeader(data);
      } catch (error) {
        console.error('Error fetching partidas:', error);
        setPartidasHeader([]);
      } finally {
        setIsLoadingPartidas(false);
      }
    };

    fetchPartidas();
  }, [selectedGrupoId, setValue]);

  // EFECTO FINAL: Cargar Códigos de Actividad Proyecto
  useEffect(() => {
    const fetchCodigos = async () => {
      setValue('codigoProyecto', ''); // Reset al cambiar cualquier dependencia anterior

      if (
        !selectedPoa ||
        !selectedProyectoId ||
        !selectedGrupoId ||
        !selectedPartidaId
      ) {
        setCodigosPresupuestarios([]);
        return;
      }

      try {
        setIsLoadingCodigos(true);
        const data = await catalogosService.getCodigosPresupuestariosFilter(
          selectedPoa,
          Number(selectedProyectoId),
          Number(selectedGrupoId),
          Number(selectedPartidaId)
        );
        setCodigosPresupuestarios(data);
      } catch (error) {
        console.error('Error fetching codigos presupuestarios:', error);
        setCodigosPresupuestarios([]);
      } finally {
        setIsLoadingCodigos(false);
      }
    };

    fetchCodigos();
  }, [
    selectedPoa,
    selectedProyectoId,
    selectedGrupoId,
    selectedPartidaId,
    setValue,
  ]);

  // EFECTO: Cargar detalle del presupuesto (Dinero)
  useEffect(() => {
    const fetchPresupuesto = async () => {
      if (
        !selectedPoa ||
        !selectedProyectoId ||
        !selectedGrupoId ||
        !selectedPartidaId ||
        !selectedCodigoProyecto
      ) {
        onBudgetChange?.(0);
        return;
      }

      try {
        const data = await catalogosService.getPoaDetail({
          codigoPoa: selectedPoa,
          proyectoId: Number(selectedProyectoId),
          grupoId: Number(selectedGrupoId),
          partidaId: Number(selectedPartidaId),
          codigoPresupuestarioId: selectedCodigoProyecto,
        });
        onBudgetChange?.(data.costoTotal);
      } catch (error) {
        console.error('Error fetching POA detail:', error);
        onBudgetChange?.(0);
      }
    };

    fetchPresupuesto();
  }, [
    selectedPoa,
    selectedProyectoId,
    selectedGrupoId,
    selectedPartidaId,
    selectedCodigoProyecto,
    onBudgetChange,
  ]);

  const handlePoaChange = async (codigo: string) => {
    if (!codigo) {
      setValue('codigoPOA', '');
      setValue('proyecto', '');
      setValue('grupo', '');
      setValue('partida', '');
      setValue('codigoProyecto', '');
      setProjects([]);
      setFilteredGroups([]);
      setPartidasHeader([]);
      setCodigosPresupuestarios([]);
      onBudgetChange?.(0);
      return;
    }

    // Reset manual de todos los campos dependientes para evitar datos corruptos
    setValue('codigoPOA', codigo);
    setValue('proyecto', '');
    setValue('grupo', '');
    setValue('partida', '');
    setValue('codigoProyecto', '');

    // Limpiar estados locales de cascada
    setProjects([]);
    setFilteredGroups([]);
    setPartidasHeader([]);
    setCodigosPresupuestarios([]);
    onBudgetChange?.(0);

    try {
      setIsLoadingProjects(true);
      const data = await catalogosService.getProyectosByPoa(codigo);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const filteredPoaCodes = poaCodes.filter((item) =>
    item.codigo.toLowerCase().includes(poaSearch.toLowerCase())
  );

  return (
    <FieldGroup className="space-y-6">
      {/* SECCIÓN 1: PROYECTOS */}
      <FieldSet>
        <FieldLegend>Proyectos</FieldLegend>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={control}
            name="codigoPOA"
            render={({ field }) => (
              <Field>
                <FieldLabel>Código POA</FieldLabel>
                <Combobox
                  value={field.value}
                  open={isPoaOpen}
                  onOpenChange={(val) => {
                    setIsPoaOpen(val);
                    if (val) setPoaSearch('');
                  }}
                  onValueChange={(val) => {
                    if (typeof val === 'string') {
                      handlePoaChange(val);
                      setPoaSearch('');
                      setIsPoaOpen(false);
                    }
                  }}
                >
                  <FormControl>
                    <ComboboxTrigger
                      ref={triggerRef}
                      className="border-input ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => setIsPoaOpen(!isPoaOpen)}
                    >
                      <ComboboxValue>
                        {field.value || 'Seleccionar POA...'}
                      </ComboboxValue>
                    </ComboboxTrigger>
                  </FormControl>
                  <ComboboxContent
                    anchor={triggerRef}
                    className="w-[var(--anchor-width)] p-0"
                    align="start"
                    side="bottom"
                  >
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <ComboboxInput
                        autoFocus
                        placeholder="Buscar código POA..."
                        className="placeholder:text-muted-foreground h-10 w-full bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        value={poaSearch}
                        onChange={(e) => setPoaSearch(e.target.value)}
                      />
                    </div>
                    <ComboboxList className="max-h-[300px] overflow-y-auto p-1">
                      {filteredPoaCodes.length === 0 && (
                        <div className="py-6 text-center text-sm">
                          No se encontraron resultados.
                        </div>
                      )}
                      {filteredPoaCodes.map((item) => (
                        <ComboboxItem
                          key={item.codigo}
                          value={item.codigo}
                          className="data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                          <span className="truncate">{item.codigo}</span>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
            )}
          />
          <FormField
            control={control}
            name="proyecto"
            render={({ field }) => (
              <Field>
                <FieldLabel>Proyecto</FieldLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString() || ''}
                  disabled={!selectedPoa || isLoadingProjects}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      {isLoadingProjects ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                          <span className="text-muted-foreground">
                            Cargando...
                          </span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Seleccionar..." />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[300px] w-[var(--radix-select-trigger-width)]"
                  >
                    {projects.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id.toString()}>
                        {proj.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <FormField
            control={control}
            name="grupo"
            render={({ field }) => (
              <Field>
                <FieldLabel>Grupo</FieldLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString() || ''}
                  disabled={!selectedProyectoId || isLoadingGroups}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      {isLoadingGroups ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                          <span className="text-muted-foreground">
                            Cargando...
                          </span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Seleccionar..." />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[300px] w-[var(--radix-select-trigger-width)]"
                  >
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.nombre}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No hay grupos disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <FormField
            control={control}
            name="partida"
            render={({ field }) => (
              <Field>
                <FieldLabel>Partida</FieldLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString() || ''}
                  disabled={!selectedGrupoId || isLoadingPartidas}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      {isLoadingPartidas ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                          <span className="text-muted-foreground">
                            Cargando...
                          </span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Seleccionar..." />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[300px] w-[var(--radix-select-trigger-width)]"
                  >
                    {partidasHeader.length > 0 ? (
                      partidasHeader.map((partida) => (
                        <SelectItem
                          key={partida.id}
                          value={partida.id.toString()}
                        >
                          {partida.codigo} - {partida.nombre}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No hay partidas disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <FormField
            control={control}
            name="codigoProyecto"
            render={({ field }) => (
              <Field>
                <FieldLabel>Código de Actividad Proyecto</FieldLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      {isLoadingCodigos ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                          <span className="text-muted-foreground">
                            Cargando...
                          </span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Seleccionar..." />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[300px] w-[var(--radix-select-trigger-width)]"
                  >
                    {codigosPresupuestarios.length > 0 ? (
                      codigosPresupuestarios.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.codigoCompleto ||
                            (item.codigo && item.descripcion
                              ? `${item.codigo} - ${item.descripcion}`
                              : item.codigo || 'Sin Código')}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {isLoadingCodigos
                          ? 'Cargando...'
                          : 'No hay códigos disponibles'}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </div>
      </FieldSet>

      <Separator />

      {/* SECCIÓN 2: INFORMACIÓN DEL VIAJE/TALLER */}
      <FieldSet>
        <FieldLegend>Información del Viaje/Taller</FieldLegend>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="motivo"
            render={({ field }) => (
              <Field className="md:col-span-2">
                <FieldLabel>
                  Motivo <span className="text-red-500">*</span>
                </FieldLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Explicar motivo de la comisión..."
                    className="min-h-24"
                  />
                </FormControl>
                <FormMessage />
              </Field>
            )}
          />
        </div>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend>Viáticos / Pasajes</FieldLegend>
        <SolicitudViaticos
          control={control}
          actividadesPlanificadas={watchActividades || []}
          conceptos={conceptos}
        />
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend>
          Otros Gastos <span className="text-red-500">*</span>
        </FieldLegend>
        <SolicitudGastos
          control={control}
          grupos={filteredGroups}
          tiposGasto={tiposGasto}
          proyectoId={Number(selectedProyectoId)}
        />
      </FieldSet>
    </FieldGroup>
  );
}
