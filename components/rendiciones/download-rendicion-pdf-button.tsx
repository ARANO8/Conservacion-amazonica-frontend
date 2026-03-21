'use client';

import { useState } from 'react';
import axios from 'axios';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { rendicionesService } from '@/lib/services/rendiciones-service';

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
      const blob = await rendicionesService.downloadPdf(rendicionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF de rendición descargado correctamente.');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.info('Descarga PDF para rendiciones en preparación.');
      } else {
        toast.error('No se pudo descargar el PDF de la rendición.');
      }
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
