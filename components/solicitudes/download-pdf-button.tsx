'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { solicitudesService } from '@/lib/services/solicitudes-service';

interface DownloadPdfButtonProps {
  solicitudId: number;
  codigoSolicitud?: string;
}

export function DownloadPdfButton({
  solicitudId,
  codigoSolicitud = 'solicitud',
}: DownloadPdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const blob = await solicitudesService.downloadPdf(solicitudId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${codigoSolicitud}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Documento PDF descargado correctamente.');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('No se pudo descargar el documento PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      disabled={isLoading}
      className="h-8 px-2 lg:px-3"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      <span className="hidden lg:inline">Descargar</span>
    </Button>
  );
}
