import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { ShoppingCart, RefreshCw, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { usePurchases } from '../hooks';
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

export const Route = createFileRoute('/purchases')({
  component: PurchasesPage,
});

const ITEMS_PER_PAGE = 10;

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'Pendiente', variant: 'outline', icon: Clock },
  completed: { label: 'Completado', variant: 'default', icon: CheckCircle },
  failed: { label: 'Fallido', variant: 'destructive', icon: XCircle },
};

function PurchasesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch, isFetching } = usePurchases(page, ITEMS_PER_PAGE);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error('Error al cargar compras', {
        description: error instanceof Error ? error.message : 'Error de conexión con el servidor',
      });
    }
  }, [error]);

  const purchaseData = data?.data;
  const purchases = purchaseData?.purchases ?? [];
  const pagination = purchaseData?.pagination;
  const stats = {
    total: purchaseData?.total ?? 0,
    successful: purchaseData?.successful ?? 0,
    failed: purchaseData?.failed ?? 0,
  };

  const totalPages = pagination?.totalPages ?? 1;

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

  const successRate = stats.total > 0
    ? Math.round((stats.successful / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Compras en la Plaza
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Historial de compras en la plaza de mercado
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Compras</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Exitosas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successful}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fallidas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.failed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{successRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay compras registradas
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead className="text-center">Solicitado</TableHead>
                <TableHead className="text-center">Obtenido</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Orden</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => {
                const status = statusConfig[purchase.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const isPartial = purchase.status === 'completed' && purchase.obtainedQuantity < purchase.requestedQuantity;

                return (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium capitalize">
                      {purchase.ingredientName.replace(/-/g, ' ')}
                    </TableCell>
                    <TableCell className="text-center">
                      {purchase.requestedQuantity}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        'font-medium',
                        purchase.status === 'failed' && 'text-red-500',
                        isPartial && 'text-yellow-500'
                      )}>
                        {purchase.obtainedQuantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      {new Date(purchase.createdAt).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-500 dark:text-gray-400">
                      {purchase.orderId ? purchase.orderId.slice(-8) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {stats.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalPages > 1
              ? `Mostrando ${(page - 1) * ITEMS_PER_PAGE + 1}-${Math.min(page * ITEMS_PER_PAGE, stats.total)} de ${stats.total} compras`
              : `${stats.total} compras`
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
