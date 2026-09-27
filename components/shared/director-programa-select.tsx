'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

interface DirectorProgramaSelectProps {
  usuarios: Usuario[];
  /** Id del usuario elegido, como string (vacío si no hay) */
  value?: string;
  onChange: (id: string) => void;
  /** Quien llena el documento: no puede revisarse a sí mismo */
  excluirId?: string | number;
  disabled?: boolean;
}

/**
 * Combobox del Director de Programa que revisa un documento. Excluye al propio
 * autor y a Dirección Financiera (Tesorero), que aprueba después.
 */
export function DirectorProgramaSelect({
  usuarios,
  value,
  onChange,
  excluirId,
  disabled = false,
}: DirectorProgramaSelectProps) {
  const [abierto, setAbierto] = useState(false);

  const disponibles = usuarios.filter(
    (u) => String(u.id) !== String(excluirId ?? '') && u.rol !== 'TESORERO'
  );
  const elegido = usuarios.find((u) => String(u.id) === value);

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={abierto}
          disabled={disabled}
          className={cn(
            'h-9 w-full justify-between text-sm font-normal',
            !elegido && 'text-muted-foreground'
          )}
        >
          <span className="truncate">
            {elegido?.nombreCompleto ?? 'Seleccionar Director de Programa...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Buscar Director de Programa..." />
          <CommandList>
            <CommandEmpty>No se encontró el usuario.</CommandEmpty>
            <CommandGroup>
              {disponibles.map((u) => (
                <CommandItem
                  key={u.id}
                  value={`${u.nombreCompleto} ${u.cargo ?? ''}`}
                  onSelect={() => {
                    onChange(String(u.id));
                    setAbierto(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      String(u.id) === value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {u.nombreCompleto}
                  {u.cargo ? ` - ${u.cargo}` : ''}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
