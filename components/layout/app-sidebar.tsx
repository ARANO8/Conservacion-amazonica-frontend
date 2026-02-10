'use client';

import * as React from 'react';
import Image from 'next/image';
import { Bell, ClipboardPlus, FileText, LifeBuoy, Send } from 'lucide-react';

import { NavMain } from '@/components/ui/nav-main';
import { NavSecondary } from '@/components/ui/nav-secondary';
import { NavUser } from '@/components/layout/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/auth-store';
import { ModeToggle } from '@/components/mode-toggle';

// Menu items estáticos (se pueden mover a config si crecen)
const navSecondary = [
  {
    title: 'Soporte',
    url: '#',
    icon: LifeBuoy,
  },
  {
    title: 'Feedback',
    url: '#',
    icon: Send,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();

  // Lógica de roles real
  const isApprover = user?.rol === 'ADMIN' || user?.rol === 'TESORERO';

  const navMain = [
    {
      title: 'Mis Solicitudes',
      url: '/dashboard/requests',
      icon: FileText,
    },
    {
      title: 'Notificaciones',
      url: '/dashboard/inbox',
      icon: Bell,
    },
    {
      title: 'Formularios',
      url: '#',
      icon: ClipboardPlus,
      items: isApprover
        ? [{ title: 'Revisión', url: '/dashboard/revision?role=approver' }]
        : [
            { title: 'Solicitud', url: '/dashboard/solicitud' },
            { title: 'Rendicion', url: '/dashboard/rendicion' },
          ],
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex flex-row items-center justify-between px-2 py-2">
          <a href="#">
            <Image
              src="/Logo-AMZ-desk-ok.webp"
              alt="AMZ Desk"
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
  );
}
