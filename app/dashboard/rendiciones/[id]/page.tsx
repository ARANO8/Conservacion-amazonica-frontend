import { notFound } from 'next/navigation';
import { RendicionDetailClient } from './client-wrapper';
import { rendicionesService } from '@/lib/services/rendiciones-service';

interface RendicionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RendicionDetailPage({
  params,
}: RendicionDetailPageProps) {
  const { id } = await params;

  let rendicion;
  try {
    rendicion = await rendicionesService.getRendicionById(id);
  } catch (error) {
    console.error('Error fetching rendición:', error);
    notFound();
  }

  if (!rendicion) {
    notFound();
  }

  return <RendicionDetailClient rendicion={rendicion} />;
}
