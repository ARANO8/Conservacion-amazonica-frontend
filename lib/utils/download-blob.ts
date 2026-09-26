import axios from 'axios';
import { toast } from 'sonner';

const FORMATOS = {
  pdf: { mime: 'application/pdf', extension: 'pdf', nombre: 'PDF' },
  xlsx: {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx',
    nombre: 'Excel',
  },
} as const;

/**
 * Descarga un blob (PDF o Excel) desde un servicio API y lo dispara como descarga en el navegador.
 * Valida el Content-Type para evitar descargar JSON de error como un archivo corrupto.
 */
export async function downloadBlob(
  serviceFn: () => Promise<Blob>,
  fileName: string,
  options?: {
    /** Formato esperado; PDF por defecto */
    formato?: keyof typeof FORMATOS;
    /** Mensaje custom para error 404 */
    notFoundMessage?: string;
    /** Mensaje custom para error genérico */
    errorMessage?: string;
    /** Mensaje custom para éxito */
    successMessage?: string;
    /** Toast de éxito deshabilitado */
    silent?: boolean;
  }
): Promise<boolean> {
  const formato = FORMATOS[options?.formato ?? 'pdf'];

  try {
    const blob = await serviceFn();

    if (!blob.type.startsWith(formato.mime)) {
      toast.error(
        options?.errorMessage ??
          `El servidor no devolvió un ${formato.nombre} válido. Intente más tarde.`
      );
      return false;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${formato.extension}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);

    if (!options?.silent) {
      toast.success(
        options?.successMessage ??
          `Documento ${formato.nombre} descargado correctamente.`
      );
    }
    return true;
  } catch (error: unknown) {
    console.error(`[downloadBlob] Error descargando ${formato.nombre}:`, error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      toast.info(
        options?.notFoundMessage ?? 'No se encontró el PDF solicitado.'
      );
      return false;
    }
    toast.error(
      options?.errorMessage ??
        `No se pudo descargar el documento ${formato.nombre}.`
    );
    return false;
  }
}
