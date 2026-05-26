'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  BarChart3,
  Bell,
  BookOpen,
  Files,
  Home,
  LayoutGrid,
  LifeBuoy,
  Send,
  Shield,
  ShoppingCart,
  Users,
} from 'lucide-react';

import { NavMain } from '@/components/ui/nav-main';
import { NavSecondary } from '@/components/ui/nav-secondary';
import { NavUser } from '@/components/layout/nav-user';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/auth-store';
import { ModeToggle } from '@/components/mode-toggle';
import { Role } from '@/types/backend';

const SUPPORT_EMAIL = 'alanarnez51@gmail.com';

const SUPPORT_SUBJECT = '[AMZdesk] Soporte tecnico';
const SUPPORT_BODY = [
  'Hola equipo de soporte,',
  '',
  'Necesito ayuda con el sistema AMZdesk.',
  '',
  'Detalle del problema:',
  '- Modulo o pantalla:',
  '- Que accion realice:',
  '- Que resultado esperaba:',
  '- Que resultado obtuve:',
  '- Fecha y hora aproximada:',
  '',
  'Gracias.',
].join('\n');

const FEEDBACK_SUBJECT = '[AMZdesk] Sugerencia de mejora';
const FEEDBACK_BODY = [
  'Hola equipo AMZdesk,',
  '',
  'Quiero compartir una sugerencia de mejora.',
  '',
  'Detalle de la sugerencia:',
  '- Modulo o pantalla:',
  '- Situacion actual:',
  '- Propuesta de mejora:',
  '- Beneficio esperado:',
  '',
  'Gracias.',
].join('\n');

const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUPPORT_SUBJECT)}&body=${encodeURIComponent(SUPPORT_BODY)}`;
const FEEDBACK_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(FEEDBACK_SUBJECT)}&body=${encodeURIComponent(FEEDBACK_BODY)}`;

const ROLES_OPERATIVOS: Role[] = [
  'USUARIO',
  'TESORERO',
  'CONTADOR',
  'EJECUTIVO',
  'ADMIN',
  'VALIDADOR_COMPRAS',
];

function esRolOperativo(rol?: Role): boolean {
  return !!rol && ROLES_OPERATIVOS.includes(rol);
}

/**
 * Flujo "Viajes y Viáticos": listas y formularios de solicitudes y
 * rendiciones (todo lo trabajado hasta ahora pertenece a este flujo).
 */
function buildViajesItems(rol?: Role) {
  const items: { title: string; url: string }[] = [];

  if (esRolOperativo(rol)) {
    items.push({ title: 'Mis Solicitudes', url: '/app/solicitudes' });
    items.push({ title: 'Nueva Solicitud', url: '/app/solicitudes/nueva' });
    items.push({ title: 'Mis Rendiciones', url: '/app/rendiciones' });
    items.push({ title: 'Nueva Rendición', url: '/app/rendiciones/nueva' });
  }

  return items;
}

/**
 * Flujo "Compras y Servicios": inicia con el formulario de cotización.
 * Disponible para cualquier usuario autenticado.
 */
function buildComprasItems(rol?: Role) {
  const items: { title: string; url: string }[] = [];

  if (esRolOperativo(rol)) {
    items.push({
      title: 'Solicitudes de Fondos',
      url: '/app/solicitudes-compra',
    });
    items.push({ title: 'Mis Cotizaciones', url: '/app/cotizaciones' });
    items.push({ title: 'Nueva Cotización', url: '/app/cotizaciones/nueva' });
    items.push({
      title: 'Cuadros Comparativos',
      url: '/app/cuadros-comparativos',
    });
    items.push({
      title: 'Nuevo Cuadro Comparativo',
      url: '/app/cuadros-comparativos/nueva',
    });
    items.push({
      title: 'Órdenes de Compra',
      url: '/app/ordenes-compra',
    });
    items.push({
      title: 'Nueva Orden de Compra',
      url: '/app/ordenes-compra/nueva',
    });
  }

  return items;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  const [isSupportOpen, setIsSupportOpen] = React.useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);

  const userRole = user?.rol as Role | undefined;
  const canViewMonitor =
    userRole === 'ADMIN' ||
    userRole === 'EJECUTIVO' ||
    userRole === 'CONTADOR' ||
    userRole === 'TESORERO';
  const canViewAuditCenter =
    userRole === 'ADMIN' ||
    userRole === 'EJECUTIVO' ||
    userRole === 'CONTADOR' ||
    userRole === 'TESORERO';
  const canManageUsers = userRole === 'ADMIN';
  const viajesItems = buildViajesItems(userRole);
  const comprasItems = buildComprasItems(userRole);

  const navSecondary = [
    {
      title: 'Soporte',
      icon: LifeBuoy,
      onClick: () => setIsSupportOpen(true),
    },
    {
      title: 'Feedback',
      icon: Send,
      onClick: () => setIsFeedbackOpen(true),
    },
  ];

  const navMain = [
    {
      title: 'Inicio',
      url: '/app/inicio',
      icon: Home,
    },
    ...(viajesItems.length > 0
      ? [
          {
            title: 'Viajes y Viáticos',
            url: '#',
            icon: Files,
            items: viajesItems,
          },
        ]
      : []),
    ...(comprasItems.length > 0
      ? [
          {
            title: 'Compras y Servicios',
            url: '#',
            icon: ShoppingCart,
            items: comprasItems,
          },
        ]
      : []),
    {
      title: 'Notificaciones',
      url: '/app/aprobaciones',
      icon: Bell,
    },
    ...(canViewAuditCenter
      ? [
          {
            title: 'Centro de Auditoria',
            url: '/app/auditoria',
            icon: Shield,
          },
        ]
      : []),
    ...(canManageUsers
      ? [
          {
            title: 'Gestion de Usuarios',
            url: '/app/usuarios',
            icon: Users,
          },
        ]
      : []),
    {
      title: 'Base Documental',
      url: '/app/documentos',
      icon: BookOpen,
    },
    ...(canViewMonitor
      ? [
          {
            title: 'Monitores',
            url: '#',
            icon: LayoutGrid,
            items: [
              { title: 'Solicitudes', url: '/app/monitor' },
              { title: 'Rendiciones', url: '/app/monitor-rendiciones' },
            ],
          },
          {
            title: 'Analítica',
            url: '/app/analitica',
            icon: BarChart3,
          },
        ]
      : []),
  ];

  return (
    <>
      <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <div className="flex flex-row items-center justify-between px-2 py-2">
            <a href="#">
              <Image
                src="/Logo-AMZ-desk-ok.webp"
                alt="AMZdesk"
                width={120}
                height={40}
                priority
                className="h-auto w-auto max-w-[120px]"
                style={{ width: 'auto', height: 'auto' }}
              />
            </a>
            <ModeToggle />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navMain} />
          <NavSecondary items={navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soporte</DialogTitle>
            <DialogDescription>
              Para Soporte, por favor envia un correo electronico a:{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-amzdesk-helper">
              Usa un asunto claro para priorizar tu caso y comparte el detalle
              completo del problema.
            </p>
            <div className="rounded-md border p-3">
              <p className="text-amzdesk-label">Asunto sugerido</p>
              <p className="text-amzdesk-helper">[AMZdesk] Soporte tecnico</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-amzdesk-label">Detalle minimo</p>
              <ul className="text-amzdesk-helper list-disc space-y-1 pl-5">
                <li>Modulo o pantalla afectada.</li>
                <li>Accion que realizaste y resultado esperado.</li>
                <li>Resultado obtenido y fecha/hora aproximada.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setIsSupportOpen(false)}>
              Cerrar
            </Button>
            <Button asChild>
              <a href={SUPPORT_MAILTO}>Enviar Correo</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar Feedback</DialogTitle>
            <DialogDescription>
              Para Dar Feedback, por favor envia un correo electronico a:{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-amzdesk-helper">
              Describe tu sugerencia con contexto para que podamos evaluar su
              impacto y priorizacion.
            </p>
            <div className="rounded-md border p-3">
              <p className="text-amzdesk-label">Asunto sugerido</p>
              <p className="text-amzdesk-helper">
                [AMZdesk] Sugerencia de mejora
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-amzdesk-label">Detalle minimo</p>
              <ul className="text-amzdesk-helper list-disc space-y-1 pl-5">
                <li>Modulo o pantalla relacionada.</li>
                <li>Situacion actual que quieres mejorar.</li>
                <li>Propuesta de cambio y beneficio esperado.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setIsFeedbackOpen(false)}>
              Cerrar
            </Button>
            <Button asChild>
              <a href={FEEDBACK_MAILTO}>Enviar Correo</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
