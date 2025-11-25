import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  ShoppingCart,
  UtensilsCrossed,
  Bot,
  ChefHat,
  Sparkles,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';

const navMain = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Órdenes',
    url: '/orders',
    icon: ClipboardList,
  },
  {
    title: 'Inventario',
    url: '/inventory',
    icon: Package,
  },
  {
    title: 'Compras Plaza',
    url: '/purchases',
    icon: ShoppingCart,
  },
  {
    title: 'Recetas',
    url: '/recipes',
    icon: UtensilsCrossed,
  },
];

const navAI = [
  {
    title: 'Asistente IA',
    url: '/ai',
    icon: Bot,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-orange-500 text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                  <ChefHat className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">FreeLunch</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Jornada de Donación
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* AI Section */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Sparkles className="size-3 mr-1" />
            Inteligencia Artificial
          </SidebarGroupLabel>
          <SidebarMenu>
            {navAI.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" className="text-muted-foreground">
              <span className="text-xs">
                © 2025 FreeLunch - Sistema Automatizado
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
