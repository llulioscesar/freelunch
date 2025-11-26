import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Package, RefreshCw, AlertTriangle } from 'lucide-react';
import { useInventory, useInitializeInventory } from '../hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/pagination';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export const Route = createFileRoute('/inventory')({
  component: InventoryPage,
});

const ITEMS_PER_PAGE = 10;

function InventoryPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch, isFetching } = useInventory();
  const initializeMutation = useInitializeInventory();

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error('Error al cargar inventario', {
        description: error instanceof Error ? error.message : 'Error de conexión con el servidor',
      });
    }
  }, [error]);

  const allInventory = data?.data?.items ?? [];
  const lastUpdated = data?.data?.lastUpdated;

  // Client-side pagination
  const totalItems = allInventory.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const inventory = allInventory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleInitialize = async () => {
    try {
      await initializeMutation.mutateAsync();
      toast.success('Inventario inicializado correctamente');
    } catch {
      toast.error('Error al inicializar el inventario');
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Sin stock', variant: 'destructive' as const, color: 'red' };
    if (quantity <= 2) return { label: 'Bajo', variant: 'outline' as const, color: 'yellow' };
    if (quantity <= 5) return { label: 'Normal', variant: 'secondary' as const, color: 'blue' };
    return { label: 'Alto', variant: 'default' as const, color: 'green' };
  };

  const totalUnits = allInventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = allInventory.filter(item => item.quantity <= 2).length;
  const outOfStockCount = allInventory.filter(item => item.quantity === 0).length;

  const handlePrevious = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) pages.push(i);
      } else if (page >= totalPages - 2) {
        for (let i = Math.max(1, totalPages - maxVisible + 1); i <= totalPages; i++) pages.push(i);
      } else {
        for (let i = page - 2; i <= page + 2; i++) pages.push(i);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Inventario
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Stock de ingredientes en la bodega
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Actualizar
          </button>
          <button
            onClick={handleInitialize}
            disabled={initializeMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {initializeMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            Inicializar Stock
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Unidades</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUnits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Stock Bajo</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sin Stock</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : allInventory.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No hay ingredientes en el inventario
            </p>
            <button
              onClick={handleInitialize}
              disabled={initializeMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              Inicializar Inventario
            </button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Última Actualización</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const status = getStockStatus(item.quantity);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium capitalize">
                        {item.ingredientName.replace(/-/g, ' ')}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          'font-bold text-lg',
                          item.quantity === 0 && 'text-red-500',
                          item.quantity > 0 && item.quantity <= 2 && 'text-yellow-500',
                          item.quantity > 2 && 'text-gray-900 dark:text-white'
                        )}>
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-gray-500 dark:text-gray-400">
                        {new Date(item.updatedAt).toLocaleString('es-CO', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {lastUpdated && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                Última sincronización: {new Date(lastUpdated).toLocaleString('es-CO')}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalPages > 1
              ? `Mostrando ${startIndex + 1}-${Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} de ${totalItems} ingredientes`
              : `${totalItems} ingredientes`
            }
          </p>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={handlePrevious}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {getPageNumbers().map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={page === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={handleNext}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
