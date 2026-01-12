'use client';

import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  planificacion: 'Planificación',
  solicitudes: 'Solicitudes',
  solicitud: 'Solicitud',
  nueva: 'Nueva',
  reportes: 'Reportes',
  configuracion: 'Configuración',
};

export function DynamicBreadcrumbs() {
  const pathname = usePathname();
  // Eliminar trailing slash y dividir
  const segments = pathname.split('/').filter((item) => item !== '');

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const name =
            routeNameMap[segment] ||
            segment.charAt(0).toUpperCase() + segment.slice(1);

          return (
            <Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
