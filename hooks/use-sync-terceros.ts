import { useEffect } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { FormData } from '@/components/solicitudes/solicitud-schema';

const emptyTercero = () => ({ nombreCompleto: '', procedenciaInstitucion: '' });

const isFilled = (t: {
  nombreCompleto?: string;
  procedenciaInstitucion?: string;
}) => !!t.nombreCompleto?.trim() || !!t.procedenciaInstitucion?.trim();

/**
 * Mantiene sincronizado `actividades[i].terceros` con `actividades[i].cantTerceros`.
 *
 * - Si el conteo sube, agrega cards vacías al final.
 * - Si baja, recorta por el final y avisa cuando se pierden datos ya escritos.
 *
 * Se invoca desde el contenedor del wizard (siempre montado) para que el aviso
 * aparezca en el momento en que el usuario cambia el número en el Paso 1.
 */
export function useSyncTerceros(form: UseFormReturn<FormData>) {
  const actividades = useWatch({
    control: form.control,
    name: 'actividades',
  });

  // Firma de solo los conteos: evita reconciliar al teclear en otros campos.
  const conteosKey = (actividades || [])
    .map((a) => a?.cantTerceros ?? '')
    .join('|');

  useEffect(() => {
    const current = form.getValues('actividades') || [];

    current.forEach((actividad, index) => {
      const deseado = Number(actividad?.cantTerceros);

      // El input queda vacío/NaN de forma transitoria mientras se teclea.
      if (!Number.isFinite(deseado) || deseado < 0) return;

      const terceros = actividad?.terceros || [];
      if (terceros.length === deseado) return;

      if (deseado > terceros.length) {
        const faltantes = deseado - terceros.length;
        form.setValue(
          `actividades.${index}.terceros`,
          [...terceros, ...Array.from({ length: faltantes }, emptyTercero)],
          { shouldDirty: true }
        );
        return;
      }

      const removidos = terceros.slice(deseado);
      form.setValue(
        `actividades.${index}.terceros`,
        terceros.slice(0, deseado),
        {
          shouldDirty: true,
        }
      );

      const conDatos = removidos.filter(isFilled).length;
      if (conDatos > 0) {
        const nombre = actividad?.actividadProgramada?.trim();
        toast.info(
          `Se removió ${conDatos} persona${conDatos > 1 ? 's' : ''} de la nómina${
            nombre ? ` de "${nombre}"` : ''
          }`
        );
      }
    });
  }, [conteosKey, form]);
}
