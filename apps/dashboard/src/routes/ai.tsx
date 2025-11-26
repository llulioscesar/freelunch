import { createFileRoute } from '@tanstack/react-router';
import { Bot, Sparkles, AlertTriangle, RefreshCw, ChefHat, Wrench } from 'lucide-react';
import { useRecommendations } from '../hooks/useRecommendations';
import { dispatchOpenChat } from '../components/FloatingChat';
import type { CriticalAlert, RecipeRecommendation } from '../types/api';

export const Route = createFileRoute('/ai')({
  component: AIPage,
});

function AlertBadge({ urgency }: { urgency: CriticalAlert['urgency'] }) {
  const colors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };
  const labels = { high: 'Urgente', medium: 'Medio', low: 'Bajo' };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[urgency]}`}>
      {labels[urgency]}
    </span>
  );
}

function AlertCard({ alert }: { alert: CriticalAlert }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
        alert.urgency === 'high' ? 'text-red-500' :
        alert.urgency === 'medium' ? 'text-yellow-500' : 'text-blue-500'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900 dark:text-white capitalize">
            {alert.ingredient}
          </span>
          <AlertBadge urgency={alert.urgency} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {alert.suggestion}
        </p>
      </div>
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: RecipeRecommendation }) {
  const viabilityColor = recipe.viability >= 80
    ? 'text-green-500'
    : recipe.viability >= 50
      ? 'text-yellow-500'
      : 'text-red-500';

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <ChefHat className="h-5 w-5 mt-0.5 flex-shrink-0 text-orange-500" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900 dark:text-white">
            {recipe.recipe}
          </span>
          <span className={`font-bold ${viabilityColor}`}>
            {recipe.viability}%
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {recipe.reason}
        </p>
      </div>
    </div>
  );
}

function AIPage() {
  const { recommendations, loading, error, refetch } = useRecommendations();

  const highAlerts = recommendations?.criticalAlerts.filter(a => a.urgency === 'high') || [];
  const mediumAlerts = recommendations?.criticalAlerts.filter(a => a.urgency === 'medium') || [];
  const lowAlerts = recommendations?.criticalAlerts.filter(a => a.urgency === 'low') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Asistente IA
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Recomendaciones inteligentes powered by Gemini
            </p>
          </div>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">Error: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Alerts Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Alertas Criticas
            </h2>
            <div className="ml-auto flex items-center gap-2">
              {recommendations && recommendations.criticalAlerts.length > 0 && (
                <button
                  onClick={() => {
                    const ingredients = recommendations.criticalAlerts.map(a => a.ingredient);
                    const message = `Compra 10 unidades de cada uno de estos ingredientes: ${ingredients.join(', ')}`;
                    dispatchOpenChat(message);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Wrench className="h-4 w-4" />
                  Solucionar
                </button>
              )}
              {recommendations && (
                <span className="text-sm text-gray-500">
                  {recommendations.criticalAlerts.length} alertas
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg h-20" />
              ))}
            </div>
          ) : recommendations?.criticalAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No hay alertas criticas
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {highAlerts.map((alert, i) => (
                <AlertCard key={`high-${i}`} alert={alert} />
              ))}
              {mediumAlerts.map((alert, i) => (
                <AlertCard key={`medium-${i}`} alert={alert} />
              ))}
              {lowAlerts.map((alert, i) => (
                <AlertCard key={`low-${i}`} alert={alert} />
              ))}
            </div>
          )}
        </div>

        {/* Recipe Ranking Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recetas Recomendadas
            </h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Ranking basado en disponibilidad de ingredientes y tasa de exito.
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg h-20" />
              ))}
            </div>
          ) : recommendations?.recipeRanking.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No hay recetas disponibles para recomendar
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {recommendations?.recipeRanking.map((recipe, i) => (
                <RecipeCard key={i} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </div>

      {recommendations?.generatedAt && (
        <p className="text-center text-sm text-gray-400">
          Ultima actualizacion: {new Date(recommendations.generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
