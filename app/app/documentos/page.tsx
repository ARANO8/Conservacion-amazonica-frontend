import {
  BookOpen,
  ExternalLink,
  Download,
  FileText,
  BookMarked,
  TrendingUp,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface Documento {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: 'financiero' | 'administrativo' | 'planificacion';
  version: string;
  año: number;
  tipo: 'pdf_local' | 'enlace_externo';
  url: string;
  icon: React.ElementType;
  destacado?: boolean;
}

const DOCUMENTOS: Documento[] = [
  {
    id: 'instructivo-fondos',
    titulo: 'Instructivo de Manejo de Fondos',
    descripcion:
      'Lineamientos y procedimientos para el manejo, control y rendición de fondos de la organización. Incluye políticas de viáticos, anticipos y gastos operativos.',
    categoria: 'financiero',
    version: 'v2025',
    año: 2025,
    tipo: 'pdf_local',
    url: '/docs/instructivo-manejo-fondos-2025.pdf',
    icon: BookMarked,
    destacado: true,
  },
  {
    id: 'manual-procedimientos',
    titulo: 'Manual de Procedimientos Administrativos',
    descripcion:
      'Manual institucional que describe los procesos, flujos de aprobación y responsabilidades para las operaciones administrativas de ACEAA.',
    categoria: 'administrativo',
    version: 'Vigente',
    año: 2025,
    tipo: 'pdf_local',
    url: '/docs/manual-procedimientos-administrativos.pdf',
    icon: FileText,
    destacado: true,
  },
  {
    id: 'poa-2026',
    titulo: 'Plan Operativo Anual 2026',
    descripcion:
      'Planificación operativa y presupuestaria de ACEAA para el año 2026. Contiene las partidas presupuestarias, metas e indicadores por proyecto.',
    categoria: 'planificacion',
    version: 'POA 2026',
    año: 2026,
    tipo: 'enlace_externo',
    url: 'https://conservacionamazonica-my.sharepoint.com/:x:/g/personal/galtuzarra_conservacionamazonica_org_bo/IQDUO34urbU3Tq3jJfjOysPKAaRltT1hl8Vs-RGUmx0rBtw?e=UMNxCb',
    icon: TrendingUp,
    destacado: false,
  },
  {
    id: 'planilla-alimentacion',
    titulo: 'Planilla de Alimentación',
    descripcion:
      'Formulario para el registro y rendición de gastos de alimentación durante comisiones de servicio. Incluye viáticos diarios y detalle de consumos.',
    categoria: 'financiero',
    version: 'v2025',
    año: 2025,
    tipo: 'pdf_local',
    url: '/docs/01 PLANILLA DE ALIMENTACIÓN.pdf',
    icon: FileText,
    destacado: false,
  },
  {
    id: 'planilla-viaticos-terceros',
    titulo: 'Planilla de Viáticos para Terceros',
    descripcion:
      'Formulario para la solicitud y rendición de viáticos a terceros no vinculados laboralmente a la organización.',
    categoria: 'financiero',
    version: 'v2025',
    año: 2025,
    tipo: 'pdf_local',
    url: '/docs/02 PLANILLA VIATICOS TERCEROS.pdf',
    icon: FileText,
    destacado: false,
  },
  {
    id: 'planilla-pasajes-terceros',
    titulo: 'Planilla de Pasajes para Terceros',
    descripcion:
      'Formulario para la solicitud y rendición de pasajes aéreos y terrestres para terceros, con detalle de rutas y montos.',
    categoria: 'financiero',
    version: 'v2025',
    año: 2025,
    tipo: 'pdf_local',
    url: '/docs/03 PLANILLA PASAJES TERCEROS.pdf',
    icon: FileText,
    destacado: false,
  },
];

const CATEGORIA_LABELS: Record<Documento['categoria'], string> = {
  financiero: 'Financiero',
  administrativo: 'Administrativo',
  planificacion: 'Planificación',
};

const CATEGORIA_VARIANT: Record<
  Documento['categoria'],
  'default' | 'secondary' | 'outline'
> = {
  financiero: 'default',
  administrativo: 'secondary',
  planificacion: 'outline',
};

export default function BaseDocumentalPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-3">
        <BookOpen className="text-primary mt-1 h-6 w-6 shrink-0" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base Documental</h1>
          <p className="text-muted-foreground">
            Documentos institucionales de referencia para el personal de ACEAA.
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {DOCUMENTOS.map((doc) => {
          const Icon = doc.icon;
          const esExterno = doc.tipo === 'enlace_externo';
          const esPendiente = doc.url === '#';

          return (
            <Card
              key={doc.id}
              className="flex flex-col transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant={CATEGORIA_VARIANT[doc.categoria]}>
                    {CATEGORIA_LABELS[doc.categoria]}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-base leading-snug">
                  {doc.titulo}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {doc.descripcion}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span className="rounded-md border px-2 py-0.5 font-medium">
                    {doc.version}
                  </span>
                  <span>·</span>
                  <span>{doc.año}</span>
                  {esExterno && (
                    <>
                      <span>·</span>
                      <span>Enlace externo</span>
                    </>
                  )}
                </div>
              </CardContent>

              <CardFooter className="mt-auto flex gap-2 pt-0">
                {esPendiente ? (
                  <Button variant="outline" className="flex-1" disabled>
                    Próximamente
                  </Button>
                ) : esExterno ? (
                  <Button asChild className="flex-1">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir
                    </a>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="flex-1">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        Ver
                      </a>
                    </Button>
                    <Button asChild variant="secondary" size="icon">
                      <a href={doc.url} download>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Descargar</span>
                      </a>
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Para solicitar la incorporación de nuevos documentos, contacta al
        administrador del sistema.
      </p>
    </div>
  );
}
