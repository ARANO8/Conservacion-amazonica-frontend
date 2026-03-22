'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  BarChart3,
  Bell,
  ClipboardPlus,
  Files,
  Home,
  LayoutGrid,
  LifeBuoy,
  Send,
  Shield,
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

/**
 * Construye los sub-ítems del menú "Formularios" según el rol del usuario.
 */
function buildFormularioItems(rol?: Role) {
  const items: { title: string; url: string }[] = [];

  // Solicitud: USUARIO, TESORERO, EJECUTIVO y ADMIN pueden crear solicitudes
  if (
    rol === 'USUARIO' ||
    rol === 'TESORERO' ||
    rol === 'EJECUTIVO' ||
    rol === 'ADMIN'
  ) {
    items.push({ title: 'Solicitud', url: '/app/solicitudes/nueva' });
  }

  // Rendición: disponible para perfiles operativos
  if (
    rol === 'USUARIO' ||
    rol === 'TESORERO' ||
    rol === 'EJECUTIVO' ||
    rol === 'ADMIN'
  ) {
    items.push({ title: 'Rendición', url: '/app/rendiciones/nueva' });
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
    userRole === 'TESORERO' ||
    userRole === 'AUDITOR';
  const canViewAuditCenter =
    userRole === 'ADMIN' ||
    userRole === 'EJECUTIVO' ||
    userRole === 'TESORERO' ||
    userRole === 'AUDITOR';
  const canManageUsers = userRole === 'ADMIN';
  const formularioItems = buildFormularioItems(userRole);

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
    {
      title: 'Mis Tramites',
      url: '#',
      icon: Files,
      items: [
        { title: 'Solicitudes', url: '/app/solicitudes' },
        { title: 'Rendiciones', url: '/app/rendiciones' },
      ],
    },
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
    ...(formularioItems.length > 0
      ? [
          {
            title: 'Formularios',
            url: '#',
            icon: ClipboardPlus,
            items: formularioItems,
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
