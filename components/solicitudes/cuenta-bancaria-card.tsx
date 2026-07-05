import { Landmark } from 'lucide-react';
import { CuentaBancaria } from '@/types/backend';

interface CuentaBancariaCardProps {
  cuentaBancaria?: CuentaBancaria | null;
}

export function CuentaBancariaCard({
  cuentaBancaria,
}: CuentaBancariaCardProps) {
  if (!cuentaBancaria) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <p className="text-center text-sm text-gray-500 italic dark:text-gray-400">
          Cuenta bancaria no asignada a este proyecto.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 shadow-sm xl:rounded-xl dark:border-blue-900/30 dark:bg-blue-950/20">
      <div className="mb-3 flex items-center gap-2 border-b border-blue-100/50 pb-3 dark:border-blue-900/50">
        <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <span className="text-base font-bold text-blue-950 dark:text-blue-50">
          {cuentaBancaria.banco || 'Banco no especificado'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-blue-600/70 uppercase dark:text-blue-400/70">
            Nro. de Cuenta
          </p>
          <p className="mt-0.5 text-sm font-semibold tracking-wide text-blue-950 dark:text-blue-50">
            {cuentaBancaria.numeroCuenta || 'S/N'}
          </p>
        </div>
        {cuentaBancaria.moneda && (
          <div>
            <p className="text-[10px] font-bold tracking-widest text-blue-600/70 uppercase dark:text-blue-400/70">
              Moneda
            </p>
            <p className="mt-0.5 text-sm font-semibold text-blue-950 dark:text-blue-50">
              {cuentaBancaria.moneda}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
