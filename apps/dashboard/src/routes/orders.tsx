import { createFileRoute } from '@tanstack/react-router';
import { ClipboardList } from 'lucide-react';

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <div className="space-y-6">
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

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Próximamente: Lista de órdenes en tiempo real
        </p>
      </div>
    </div>
  );
}
