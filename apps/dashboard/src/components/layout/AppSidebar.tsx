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
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

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
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

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
          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" className="text-muted-foreground">
                <span className="text-xs truncate">{user.email}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="size-4" />
              <span>Cerrar sesion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
