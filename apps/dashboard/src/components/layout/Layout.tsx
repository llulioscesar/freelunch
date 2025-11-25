import { useLocation } from '@tanstack/react-router';
import { AppSidebar } from './AppSidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const routeTitles: Record<string, { title: string; parent?: string }> = {
  '/': { title: 'Dashboard' },
  '/orders': { title: 'Órdenes', parent: 'Gestión' },
  '/inventory': { title: 'Inventario', parent: 'Gestión' },
  '/purchases': { title: 'Compras Plaza', parent: 'Gestión' },
  '/recipes': { title: 'Recetas', parent: 'Gestión' },
  '/ai': { title: 'Asistente IA', parent: 'Inteligencia Artificial' },
};

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const currentRoute = routeTitles[location.pathname] || { title: 'Página' };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {currentRoute.parent && (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/">
                        {currentRoute.parent}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentRoute.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
