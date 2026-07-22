'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rendicionesService } from '@/lib/services/rendiciones-service';
import { downloadBlob } from '@/lib/utils/download-blob';

interface DownloadRendicionPdfButtonProps {
  rendicionId: number;
  fileName?: string;
}

export function DownloadRendicionPdfButton({
  rendicionId,
  fileName = 'rendicion',
}: DownloadRendicionPdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      await downloadBlob(
        () => rendicionesService.downloadPdf(rendicionId),
        fileName,
        {
          notFoundMessage: 'Descarga PDF para rendiciones en preparación.',
          errorMessage: 'No se pudo descargar el PDF de la rendición.',
          successMessage: 'PDF de rendición descargado correctamente.',
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
