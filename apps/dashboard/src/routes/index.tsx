import { createFileRoute } from '@tanstack/react-router';
import {
  ClipboardList,
  Package,
  ShoppingCart,
  UtensilsCrossed,
  TrendingUp,
  Clock,
} from 'lucide-react';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
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
          value="--"
          icon={ClipboardList}
          color="blue"
        />
        <StatsCard
          title="Platos Entregados"
          value="--"
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="En Preparación"
          value="--"
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Recetas Disponibles"
          value="6"
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
              defaultValue="1"
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Cantidad"
            />
            <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Crear Pedido
            </button>
          </div>
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
          <div className="text-center py-4 text-gray-400">
            Conectando con la bodega...
          </div>
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
        <div className="text-center py-8 text-gray-400">
          No hay actividad reciente
        </div>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
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
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
