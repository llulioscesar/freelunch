import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  ClipboardList,
  Package,
  ShoppingCart,
  UtensilsCrossed,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useStats, useCreateOrder, useInventory, useOrders, useRecipes } from '../hooks';
import { Skeleton } from '../components/ui/skeleton';
import type { Order, InventoryItem } from '../types/api';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const [quantity, setQuantity] = useState(1);
  const { data: stats, isLoading: statsLoading, error: statsError } = useStats();
  const { data: inventoryData, isLoading: inventoryLoading } = useInventory();
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: recipesData } = useRecipes();
  const createOrder = useCreateOrder();

  const handleCreateOrder = () => {
    createOrder.mutate({ quantity });
  };

  // Get last 5 orders for recent activity
  const recentOrders = ordersData?.orders?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Panel de control - Jornada de Donación de Comida
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Órdenes Activas"
          value={statsLoading ? undefined : stats?.summary?.activeOrders?.toString() ?? '0'}
          icon={ClipboardList}
          color="blue"
          error={!!statsError}
        />
        <StatsCard
          title="Platos Entregados"
          value={statsLoading ? undefined : stats?.summary?.platesDelivered?.toString() ?? '0'}
          icon={TrendingUp}
          color="green"
          error={!!statsError}
        />
        <StatsCard
          title="En Preparación"
          value={statsLoading ? undefined : stats?.summary?.platesInProgress?.toString() ?? '0'}
          icon={Clock}
          color="orange"
          error={!!statsError}
        />
        <StatsCard
          title="Recetas Disponibles"
          value={recipesData?.recipes?.length?.toString() ?? '6'}
          icon={UtensilsCrossed}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Order Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Crear Pedido Rápido
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Envía una nueva orden a la cocina para preparar platos aleatorios.
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Cantidad"
            />
            <button
              onClick={handleCreateOrder}
              disabled={createOrder.isPending}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Pedido'
              )}
            </button>
          </div>
          {createOrder.isError && (
            <p className="mt-2 text-sm text-red-500">
              Error: {createOrder.error?.message}
            </p>
          )}
          {createOrder.isSuccess && (
            <p className="mt-2 text-sm text-green-500">
              Pedido creado exitosamente
            </p>
          )}
        </div>

        {/* Inventory Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Estado del Inventario
            </h2>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Resumen rápido del stock de ingredientes en la bodega.
          </p>
          {inventoryLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : inventoryData?.inventory?.length ? (
            <InventorySummary items={inventoryData.inventory} />
          ) : (
            <div className="text-center py-4 text-gray-400">
              No hay inventario disponible
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Actividad Reciente
          </h2>
          <ShoppingCart className="h-5 w-5 text-gray-400" />
        </div>
        {ordersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : recentOrders.length > 0 ? (
          <RecentOrdersList orders={recentOrders} />
        ) : (
          <div className="text-center py-8 text-gray-400">
            No hay actividad reciente
          </div>
        )}
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | undefined;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange' | 'purple';
  error?: boolean;
}

function StatsCard({ title, value, icon: Icon, color, error }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          {value === undefined ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : error ? (
            <div className="flex items-center gap-1 mt-1 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Error</span>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function InventorySummary({ items }: { items: InventoryItem[] }) {
  const lowStock = items.filter((item) => item.quantity < 3);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Total ingredientes:</span>
        <span className="font-medium text-gray-900 dark:text-white">{items.length} tipos</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Stock total:</span>
        <span className="font-medium text-gray-900 dark:text-white">{totalItems} unidades</span>
      </div>
      {lowStock.length > 0 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-orange-500 font-medium">
            {lowStock.length} ingredientes con stock bajo
          </p>
        </div>
      )}
    </div>
  );
}

function RecentOrdersList({ orders }: { orders: Order[] }) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    READY: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En Progreso',
    READY: 'Listo',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
  };

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Orden #{order.id.slice(-6)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {order.items?.length ?? 0} platos • {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status] ?? statusColors.PENDING}`}
          >
            {statusLabels[order.status] ?? order.status}
          </span>
        </div>
      ))}
    </div>
  );
}
