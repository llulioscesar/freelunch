import { createFileRoute } from '@tanstack/react-router';
import { UtensilsCrossed } from 'lucide-react';
import { useRecipes } from '../hooks';
import { Skeleton } from '../components/ui/skeleton';

export const Route = createFileRoute('/recipes')({
  component: RecipesPage,
});

function RecipesPage() {
  const { data: recipesData, isLoading } = useRecipes();
  const recipeCount = recipesData?.recipes?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UtensilsCrossed className="h-8 w-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Recetas
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isLoading ? (
              <Skeleton className="h-4 w-48 inline-block" />
            ) : (
              `${recipeCount} recetas disponibles para la jornada de donación`
            )}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Próximamente: Lista de recetas con ingredientes
        </p>
      </div>
    </div>
  );
}
