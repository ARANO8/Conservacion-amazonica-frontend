import axios from 'axios';
import { toast } from 'sonner';

/**
 * Descarga un blob (PDF) desde un servicio API y lo dispara como descarga en el navegador.
 * Valida el Content-Type para evitar descargar JSON de error como "PDF corrupto".
 */
export async function downloadBlob(
  serviceFn: () => Promise<Blob>,
  fileName: string,
  options?: {
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
  try {
    const blob = await serviceFn();

    if (blob.type !== 'application/pdf') {
      toast.error(
        options?.errorMessage ??
          'El servidor no devolvió un PDF válido. Intente más tarde.'
      );
      return false;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);

    if (!options?.silent) {
      toast.success(
        options?.successMessage ?? 'Documento PDF descargado correctamente.'
      );
    }
    return true;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      toast.info(
        options?.notFoundMessage ?? 'No se encontró el PDF solicitado.'
      );
      return false;
    }
    toast.error(
      options?.errorMessage ?? 'No se pudo descargar el documento PDF.'
    );
    return false;
  }
}
