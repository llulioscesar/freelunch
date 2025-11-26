import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Calendar,
  UtensilsCrossed,
  Package,
  Flame,
  Truck,
} from 'lucide-react';
import { useOrder, useOrderHistory } from '../hooks';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../lib/utils';
import type { OrderItem, StatusHistoryEntry } from '../types/api';

export const Route = createFileRoute('/orders/$orderId')({
  component: OrderDetailPage,
});

function formatDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffMs = end - start;

  if (diffMs < 0) return '0s';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}min ${remainingSeconds}s` : `${minutes}min`;
  }
  return `${seconds}s`;
}

const statusConfig: Record<string, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ElementType;
  color: string;
}> = {
  PENDING: { label: 'Pendiente', variant: 'secondary', icon: Clock, color: 'gray' },
  ASSIGNED: { label: 'Asignado', variant: 'outline', icon: ChefHat, color: 'blue' },
  PREPARING: { label: 'Preparando', variant: 'default', icon: Loader2, color: 'blue' },
  INGREDIENTS_REQUESTED: { label: 'Ingredientes Solicitados', variant: 'default', icon: Package, color: 'yellow' },
  WAITING_FOR_INGREDIENTS: { label: 'Esperando Ingredientes', variant: 'outline', icon: Clock, color: 'yellow' },
  COOKING: { label: 'Cocinando', variant: 'default', icon: Flame, color: 'orange' },
  READY: { label: 'Listo', variant: 'outline', icon: CheckCircle2, color: 'green' },
  DELIVERED: { label: 'Entregado', variant: 'secondary', icon: Truck, color: 'green' },
  FAILED: { label: 'Fallido', variant: 'destructive', icon: XCircle, color: 'red' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive', icon: XCircle, color: 'red' },
};

const colorClasses: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  gray: { bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-300 dark:border-gray-600', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
};

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { data, isLoading, error } = useOrder(orderId);
  const { data: historyData } = useOrderHistory(orderId);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [mobileSelectedItem, setMobileSelectedItem] = useState<OrderItem | null>(null);

  const order = data?.order;
  const history = historyData?.history ?? [];

  // Compute effective selected item (user selection or first item)
  const effectiveSelectedItem = selectedItem ?? order?.items?.[0] ?? null;

  // Group history by item and sort by date
  const historyByItem = history.reduce((acc, entry) => {
    if (!acc[entry.orderItemId]) {
      acc[entry.orderItemId] = [];
    }
    acc[entry.orderItemId].push(entry);
    return acc;
  }, {} as Record<string, StatusHistoryEntry[]>);

  Object.values(historyByItem).forEach(itemHistory => {
    itemHistory.sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
  });

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">
            Orden no encontrada
          </h2>
          <p className="text-red-600 dark:text-red-300 mt-2">
            La orden {orderId} no existe o ha sido eliminada.
          </p>
        </div>
      </div>
    );
  }

  const orderStatus = statusConfig[order.status] || { label: order.status, variant: 'outline' as const, icon: Clock, color: 'gray' };
  const StatusIcon = orderStatus.icon;
  const currentItemHistory = effectiveSelectedItem ? historyByItem[effectiveSelectedItem.id] || [] : [];

  return (
    <div className="space-y-4">
      <BackLink />

      {/* Order Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Orden #{order.id}
            </h1>
            <Badge variant={orderStatus.variant} className="flex items-center gap-1">
              <StatusIcon className={`h-3 w-3 ${orderStatus.icon === Loader2 ? 'animate-spin' : ''}`} />
              {orderStatus.label}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-500">{order.progress}%</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <InfoCard icon={User} label="Cliente" value={order.customerName || 'Sin nombre'} />
          <InfoCard icon={UtensilsCrossed} label="Platos" value={`${order.completedItems} / ${order.totalItems}`} />
          <InfoCard
            icon={Calendar}
            label="Creada"
            value={new Date(order.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
          />
          <InfoCard
            icon={Clock}
            label="Actualizada"
            value={new Date(order.updatedAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
          />
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="flex h-[calc(100vh-320px)] min-h-[400px] gap-4">
        {/* Left Side - Items List */}
        <div className="w-full sm:w-72 lg:w-80 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Platos ({order.items.length})
            </h2>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div>
              {order.items.map((item, index) => {
                const status = statusConfig[item.status] || { label: item.status, variant: 'outline' as const, icon: Clock, color: 'gray' };
                const ItemIcon = status.icon;
                const isSelected = effectiveSelectedItem?.id === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      'w-full text-left px-4 py-3 transition-colors border-b border-gray-100 dark:border-gray-700',
                      'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                      isSelected && 'bg-orange-50 dark:bg-orange-900/20 border-l-2 border-l-orange-500'
                    )}
                    onClick={() => {
                      setSelectedItem(item);
                      setMobileSelectedItem(item);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 font-medium w-5">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {item.recipeName || 'Plato sin asignar'}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <ItemIcon className={cn('h-3 w-3 text-gray-400', status.icon === Loader2 && 'animate-spin')} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">{status.label}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side - Item Detail */}
        {effectiveSelectedItem ? (
          <div
            className={cn(
              'flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden',
              'absolute inset-0 z-50 sm:static sm:z-auto',
              mobileSelectedItem ? 'flex' : 'hidden sm:flex'
            )}
          >
            {/* Item Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="sm:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={() => setMobileSelectedItem(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {effectiveSelectedItem.recipeName || 'Plato sin asignar'}
                    </h3>
                    <Badge variant={statusConfig[effectiveSelectedItem.status]?.variant || 'outline'}>
                      {statusConfig[effectiveSelectedItem.status]?.label || effectiveSelectedItem.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                    {effectiveSelectedItem.id}
                  </p>
                </div>
                {/* Total Time */}
                {currentItemHistory.length > 0 && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatDuration(
                          currentItemHistory[0].changedAt,
                          currentItemHistory[currentItemHistory.length - 1].changedAt
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="p-4">
                {currentItemHistory.length > 0 ? (
                  <div className="space-y-0">
                    {currentItemHistory.map((entry, idx) => {
                      const entryStatus = statusConfig[entry.toStatus] || { label: entry.toStatus, icon: Clock, color: 'gray' };
                      const EntryIcon = entryStatus.icon;
                      const entryColors = colorClasses[entryStatus.color];
                      const isLast = idx === currentItemHistory.length - 1;

                      return (
                        <div key={entry.id || idx} className="relative flex gap-4">
                          {!isLast && (
                            <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                          )}
                          <div className={cn('relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', entryColors.dot)}>
                            <EntryIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {entryStatus.label}
                              </span>
                              {entry.fromStatus && idx > 0 && (
                                <span className="text-xs text-gray-400">
                                  (desde {statusConfig[entry.fromStatus]?.label || entry.fromStatus} - {formatDuration(currentItemHistory[idx - 1].changedAt, entry.changedAt)})
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(entry.changedAt).toLocaleString('es-CO', {
                                dateStyle: 'medium',
                                timeStyle: 'medium',
                              })}
                            </p>
                            {entry.reason && (
                              <p className="text-sm text-red-500 mt-1">
                                Razón: {entry.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                    No hay historial disponible
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Selecciona un plato
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Haz clic en un plato para ver su historial
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/orders"
      className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver a órdenes
    </Link>
  );
}

function InfoCard({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-gray-400" />
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="flex gap-4 h-[400px]">
        <Skeleton className="w-72 h-full rounded-xl" />
        <Skeleton className="flex-1 h-full rounded-xl" />
      </div>
    </div>
  );
}
