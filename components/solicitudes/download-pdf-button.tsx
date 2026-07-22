'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { downloadBlob } from '@/lib/utils/download-blob';

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
      await downloadBlob(
        () => solicitudesService.downloadPdf(solicitudId),
        codigoSolicitud,
        {
          notFoundMessage: 'No se encontró el PDF de la solicitud.',
          errorMessage: 'No se pudo descargar el PDF de la solicitud.',
          successMessage: 'PDF de solicitud descargado correctamente.',
        }
      );
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
