'use client';

import { FieldGroup, FieldSet, FieldLegend } from '@/components/ui/field';
import { ClipboardCheck } from 'lucide-react';

export default function Paso2Respaldos() {
  return (
    <FieldSet>
      <FieldLegend>Respaldos Generales de la Rendición</FieldLegend>
      <p className="text-foreground mb-6 text-sm">
        El cuadro comparativo y las cotizaciones ahora se registran en la
        solicitud. En este paso solo continúa para cargar los comprobantes
        individuales en el siguiente bloque.
      </p>

      <FieldGroup>
        <div className="bg-muted/40 rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <ClipboardCheck className="text-primary h-4 w-4" />
            <span className="text-sm font-semibold">Validación previa</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Verifica que la solicitud ya incluya sus documentos de respaldo.
            Aquí solo continuarás con gastos, comprobantes e informe de
            rendición.
          </p>
        </div>
      </FieldGroup>
    </FieldSet>
  );
}
