import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { UtensilsCrossed, RefreshCw, ChefHat } from 'lucide-react';
import { useRecipes } from '../hooks';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../lib/utils';
import type { Recipe } from '../types/api';

export const Route = createFileRoute('/recipes')({
  component: RecipesPage,
});

function RecipesPage() {
  const { data: recipesData, isLoading, refetch, isFetching } = useRecipes();
  const recipes = recipesData?.recipes ?? [];
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [mobileSelectedRecipe, setMobileSelectedRecipe] = useState<Recipe | null>(null);

  // Compute effective selected recipe (user selection or first recipe)
  const effectiveSelectedRecipe = selectedRecipe ?? recipes[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
                `${recipes.length} recetas disponibles`
              )}
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

      {/* Master-Detail Layout */}
      {isLoading ? (
        <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[400px]">
          <Skeleton className="w-72 h-full rounded-xl" />
          <Skeleton className="flex-1 h-full rounded-xl" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <ChefHat className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay recetas disponibles
          </p>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-200px)] min-h-[400px] gap-4">
          {/* Left Side - Recipes List */}
          <div className="w-full sm:w-72 lg:w-80 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Recetas ({recipes.length})
              </h2>
            </div>
            <ScrollArea className="flex-1">
              <div>
                {recipes.map((recipe) => {
                  const ingredientCount = Object.keys(recipe.ingredients).length;
                  const isSelected = effectiveSelectedRecipe?.id === recipe.id;

                  return (
                    <button
                      key={recipe.id}
                      type="button"
                      className={cn(
                        'w-full text-left px-4 py-3 transition-colors border-b border-gray-100 dark:border-gray-700',
                        'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                        isSelected && 'bg-orange-50 dark:bg-orange-900/20 border-l-2 border-l-orange-500'
                      )}
                      onClick={() => {
                        setSelectedRecipe(recipe);
                        setMobileSelectedRecipe(recipe);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <ChefHat className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {recipe.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {ingredientCount} ingredientes
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right Side - Recipe Detail */}
          {effectiveSelectedRecipe ? (
            <RecipeDetail
              recipe={effectiveSelectedRecipe}
              mobileSelected={mobileSelectedRecipe !== null}
              onBack={() => setMobileSelectedRecipe(null)}
            />
          ) : (
            <div className="hidden sm:flex flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Selecciona una receta
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Haz clic en una receta para ver sus ingredientes
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecipeDetail({ recipe, mobileSelected, onBack }: {
  recipe: Recipe;
  mobileSelected: boolean;
  onBack: () => void;
}) {
  const ingredients = Object.entries(recipe.ingredients);
  const totalUnits = ingredients.reduce((sum, [, qty]) => sum + qty, 0);

  return (
    <div
      className={cn(
        'flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden',
        'absolute inset-0 z-50 sm:static sm:z-auto',
        mobileSelected ? 'flex' : 'hidden sm:flex'
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
        <button
          type="button"
          className="sm:hidden mb-3 text-white/80 hover:text-white text-sm"
          onClick={onBack}
        >
          ← Volver
        </button>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <ChefHat className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{recipe.name}</h2>
            <p className="text-orange-100">
              {ingredients.length} ingredientes · {totalUnits} unidades totales
            </p>
          </div>
        </div>
      </div>

      {/* Ingredients List */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Ingredientes necesarios
          </h3>
          <div className="space-y-3">
            {ingredients.map(([name, quantity]) => (
              <div
                key={name}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {name.replace(/-/g, ' ')}
                  </span>
                </div>
                <Badge variant="secondary" className="text-orange-600 dark:text-orange-400">
                  x{quantity}
                </Badge>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2">
              Resumen
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-orange-600 dark:text-orange-400">Ingredientes</p>
                <p className="text-xl font-bold text-orange-800 dark:text-orange-300">
                  {ingredients.length}
                </p>
              </div>
              <div>
                <p className="text-orange-600 dark:text-orange-400">Unidades totales</p>
                <p className="text-xl font-bold text-orange-800 dark:text-orange-300">
                  {totalUnits}
                </p>
              </div>
            </div>
          </div>

          {/* Recipe ID */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 font-mono">
              ID: {recipe.id}
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
