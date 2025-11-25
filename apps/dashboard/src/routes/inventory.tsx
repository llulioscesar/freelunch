import { createFileRoute } from '@tanstack/react-router';
import { Package } from 'lucide-react';

export const Route = createFileRoute('/inventory')({
  component: InventoryPage,
});

function InventoryPage() {
  return (
    <div className="space-y-6">
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

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Próximamente: Tabla de inventario con stock actual
        </p>
      </div>
    </div>
  );
}
