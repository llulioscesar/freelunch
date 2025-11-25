import { createFileRoute } from '@tanstack/react-router';
import { Bot, Sparkles } from 'lucide-react';

export const Route = createFileRoute('/ai')({
  component: AIPage,
});

function AIPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Asistente IA
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Recomendaciones inteligentes y chat asistido
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendations Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recomendaciones
            </h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            La IA analiza el inventario y el historial para sugerir las mejores recetas.
          </p>
          <div className="text-center py-8 text-gray-400">
            Próximamente: Panel de recomendaciones con Gemini
          </div>
        </div>

        {/* Chat Assistant */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chat Asistente
            </h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Pregunta sobre el estado del sistema, inventario o sugerencias.
          </p>
          <div className="text-center py-8 text-gray-400">
            Próximamente: Chat con Gemini AI
          </div>
        </div>
      </div>
    </div>
  );
}
