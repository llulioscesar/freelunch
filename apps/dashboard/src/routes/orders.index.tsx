import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ClipboardList, Eye, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOrders, useCreateOrder } from '../hooks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/pagination';

export const Route = createFileRoute('/orders/')({
  component: OrdersPage,
});

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendiente', variant: 'secondary' },
  PREPARING: { label: 'Preparando', variant: 'default' },
  INGREDIENTS_REQUESTED: { label: 'Solicitando', variant: 'default' },
  WAITING_FOR_INGREDIENTS: { label: 'Esperando', variant: 'outline' },
  COOKING: { label: 'Cocinando', variant: 'default' },
  READY: { label: 'Listo', variant: 'outline' },
  DELIVERED: { label: 'Entregado', variant: 'secondary' },
  FAILED: { label: 'Fallido', variant: 'destructive' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive' },
};

const ITEMS_PER_PAGE = 10;

function OrdersPage() {
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { data, isLoading, refetch, isFetching } = useOrders(page, ITEMS_PER_PAGE);
  const createOrder = useCreateOrder();
  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  const handleCreateOrder = () => {
    createOrder.mutate(
      { quantity },
      {
        onSuccess: () => {
          toast.success('Pedido creado exitosamente', {
            description: `Se creó un pedido con ${quantity} platos`,
          });
          setQuantity(1);
          setIsCreateDialogOpen(false);
          refetch();
        },
        onError: (error) => {
          toast.error('Error al crear pedido', {
            description: error.message,
          });
        },
      }
    );
  };

  const totalPages = pagination?.totalPages ?? 1;

  const handlePrevious = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handlePageClick = (pageNum: number) => {
    setPage(pageNum);
  };

  // Generate page numbers to display
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
          <ClipboardList className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Órdenes
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gestión de pedidos y seguimiento en tiempo real
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors">
                <Plus className="h-4 w-4" />
                Nueva Orden
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nueva Orden</DialogTitle>
                <DialogDescription>
                  Envía una nueva orden a la cocina para preparar platos aleatorios.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cantidad de platos
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={createOrder.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors flex items-center gap-2"
                >
                  {createOrder.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Orden'
                  )}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            No hay órdenes registradas
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const status = statusConfig[order.status] || { label: order.status, variant: 'outline' as const };
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id.slice(-8)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.customerName || 'Sin nombre'}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.quantity} platos
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        to="/orders/$orderId"
                        params={{ orderId: order.id }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors dark:text-orange-400 dark:hover:bg-orange-900/20"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {orders.length} de {pagination.total} órdenes
          </p>
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
                    onClick={() => handlePageClick(pageNum)}
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
        </div>
      )}
    </div>
  );
}
