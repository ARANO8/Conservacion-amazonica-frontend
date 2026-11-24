'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { declaracionesMovilidadService } from '@/lib/services/declaraciones-movilidad-service';
import { downloadBlob } from '@/lib/utils/download-blob';

interface DownloadDeclaracionMovilidadPdfButtonProps {
  declaracionId: number;
  fileName?: string;
}

export function DownloadDeclaracionMovilidadPdfButton({
  declaracionId,
  fileName = 'declaracion-movilidad',
}: DownloadDeclaracionMovilidadPdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      await downloadBlob(
        () => declaracionesMovilidadService.downloadPdf(declaracionId),
        fileName,
        {
          notFoundMessage: 'No se encontró la declaración de movilidad.',
          errorMessage:
            'No se pudo descargar el PDF de la declaración de movilidad.',
          successMessage: 'ANEXO 6 descargado correctamente.',
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
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
      <span className="hidden lg:inline">Descargar PDF</span>
    </Button>
  );
}

export default DownloadDeclaracionMovilidadPdfButton;
