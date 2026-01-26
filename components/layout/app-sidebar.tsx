'use client';

import * as React from 'react';
import { ClipboardPlus, Command, FileText, LifeBuoy, Send } from 'lucide-react';

import { NavMain } from '@/components/ui/nav-main';
import { NavSecondary } from '@/components/ui/nav-secondary';
import { NavUser } from '@/components/layout/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/auth-store';

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
      title: 'Solicitudes',
      url: '/dashboard/solicitudes',
      icon: FileText,
    },
    {
      title: 'Fondos para Viajes o Talleres',
      url: '#',
      icon: ClipboardPlus,
      isActive: true,
      items: isApprover
        ? [{ title: 'Revisión', url: '/dashboard/revision?role=approver' }]
        : [
            { title: 'Solicitud', url: '/dashboard/solicitud' },
            { title: 'Planificacion', url: '/dashboard/planificacion' },
            { title: 'Rendicion', url: '#' },
          ],
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">SyFin</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
