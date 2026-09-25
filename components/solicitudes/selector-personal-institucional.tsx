'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { Usuario } from '@/types/catalogs';

interface SelectorPersonalInstitucionalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarios: Usuario[];
  requeridos: number;
  seleccionados: number[];
  actividad?: string;
  onConfirm: (ids: number[]) => void;
}

/**
 * Modal del Paso 1 para elegir, entre los usuarios activos, al personal
 * institucional que participa en una actividad. La cantidad a elegir la fija
 * la columna "Pers. Inst." de la fila.
 */
export default function SelectorPersonalInstitucional({
  open,
  onOpenChange,
  ...props
}: SelectorPersonalInstitucionalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Se monta al abrir: el borrador parte siempre de lo ya guardado */}
        {open && (
          <SelectorContenido onClose={() => onOpenChange(false)} {...props} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SelectorContenido({
  usuarios,
  requeridos,
  seleccionados,
  actividad,
  onConfirm,
  onClose,
}: Omit<SelectorPersonalInstitucionalProps, 'open' | 'onOpenChange'> & {
  onClose: () => void;
}) {
  const [borrador, setBorrador] = useState<number[]>(() =>
    seleccionados.slice(0, requeridos)
  );

  const completo = borrador.length === requeridos;

  const toggle = (id: number) => {
    setBorrador((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= requeridos) return prev;
      return [...prev, id];
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Personal institucional</DialogTitle>
        <DialogDescription>
          Selecciona {requeridos} persona{requeridos === 1 ? '' : 's'} que
          participa{requeridos === 1 ? '' : 'n'} en{' '}
          {actividad?.trim() ? `"${actividad.trim()}"` : 'la actividad'}.
        </DialogDescription>
      </DialogHeader>

      <Command className="rounded-lg border">
        <CommandInput placeholder="Buscar por nombre o cargo..." />
        <CommandList className="max-h-72">
          <CommandEmpty>No se encontró personal.</CommandEmpty>
          <CommandGroup>
            {usuarios.map((usuario) => {
              const marcado = borrador.includes(usuario.id);
              const bloqueado = !marcado && completo;
              return (
                <CommandItem
                  key={usuario.id}
                  value={`${usuario.nombreCompleto} ${usuario.cargo ?? ''} ${usuario.id}`}
                  data-checked={marcado}
                  disabled={bloqueado}
                  onSelect={() => toggle(usuario.id)}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{usuario.nombreCompleto}</span>
                    {usuario.cargo && (
                      <span className="text-muted-foreground truncate text-xs">
                        {usuario.cargo}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>

      <DialogFooter className="items-center sm:justify-between">
        <span
          className={cn(
            'text-xs font-medium',
            completo ? 'text-muted-foreground' : 'text-destructive'
          )}
        >
          Seleccionados: {borrador.length} / {requeridos}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!completo}
            onClick={() => {
              onConfirm(borrador);
              onClose();
            }}
          >
            Confirmar
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
