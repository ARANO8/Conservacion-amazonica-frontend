'use client';

import * as React from 'react';
import { ClipboardPlus, Command, LifeBuoy, Send } from 'lucide-react';

import { NavMain } from '@/components/ui/nav-main';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

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

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navSecondary: [
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
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const searchParams = useSearchParams();
  const isApprover = searchParams.get('role') === 'approver';

  const navMain = [
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
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
