import { SystemContext } from '../types';

export function buildRecommendationsPrompt(context: SystemContext): string {
  const inventoryText = context.inventory
    .map((i) => `- ${i.ingredientName}: ${i.quantity} unidades`)
    .join('\n');

  const recipesText = context.recipes
    .map((r) => {
      const ingredients = Object.entries(r.ingredients)
        .map(([name, qty]) => `${name}(${qty})`)
        .join(', ');
      return `- ${r.name}: necesita ${ingredients}`;
    })
    .join('\n');

  const failedText = context.recentFailedPurchases.length > 0
    ? context.recentFailedPurchases.map((i) => `- ${i}`).join('\n')
    : 'Ninguna';

  // Kitchen stats section
  let kitchenStatsText = '';
  if (context.kitchenStats) {
    const mostPrepared = context.kitchenStats.recipes.mostPrepared
      .slice(0, 5)
      .map((r) => `- ${r.recipeName}: ${r.total} preparados (${r.successRate}% éxito)`)
      .join('\n');

    const failureReasons = context.kitchenStats.failures.byReason
      .slice(0, 5)
      .map((f) => `- ${f.reason}: ${f.count} veces`)
      .join('\n');

    kitchenStatsText = `
## ESTADÍSTICAS DE COCINA
- Platos totales: ${context.kitchenStats.plates.total}
- Platos listos: ${context.kitchenStats.plates.byStatus['READY'] || 0}
- Platos fallidos: ${context.kitchenStats.plates.byStatus['FAILED'] || 0}

### Recetas más preparadas
${mostPrepared || 'Sin datos'}

### Razones de fallo más comunes
${failureReasons || 'Sin fallos'}`;
  }

  // Orders stats section
  let ordersStatsText = '';
  if (context.ordersStats) {
    ordersStatsText = `
## ESTADÍSTICAS DE ÓRDENES
- Órdenes totales: ${context.ordersStats.orders.total}
- Órdenes activas: ${context.ordersStats.orders.active}
- Órdenes completadas: ${context.ordersStats.orders.completed}
- Órdenes fallidas: ${context.ordersStats.orders.failed}
- Items en preparación: ${context.ordersStats.items.preparing}
- Items listos: ${context.ordersStats.items.ready}
- Items entregados: ${context.ordersStats.items.delivered}`;
  }

  // Warehouse stats section
  let warehouseStatsText = '';
  if (context.warehouseStats) {
    const lowStock = context.warehouseStats.inventory.lowStockItems
      .map((i) => `- ${i.ingredientName}: ${i.quantity} unidades`)
      .join('\n');

    const failedByIngredient = context.warehouseStats.failedPurchasesByIngredient
      .slice(0, 5)
      .map((f) => `- ${f.ingredientName}: ${f.failedCount} fallos${f.lastError ? ` (${f.lastError})` : ''}`)
      .join('\n');

    warehouseStatsText = `
## ALERTAS DE ALMACÉN
- Sin stock: ${context.warehouseStats.inventory.outOfStock} ingredientes
- Stock bajo: ${context.warehouseStats.inventory.lowStock} ingredientes
- Tasa de éxito en compras: ${context.warehouseStats.purchases.successRate}%

### Ingredientes con stock bajo
${lowStock || 'Ninguno'}

### Ingredientes con más fallos de compra
${failedByIngredient || 'Ninguno'}`;
  }

  return `Eres un asistente de cocina para un sistema de donación de comida llamado FreeLunch.
Tu trabajo es analizar el estado actual y dar recomendaciones útiles.

## INVENTARIO ACTUAL
${inventoryText || 'Sin inventario'}

## RECETAS DISPONIBLES
${recipesText || 'Sin recetas'}

## ESTADÍSTICAS DE COMPRAS
- Total de compras: ${context.purchaseStats.total}
- Exitosas: ${context.purchaseStats.successful}
- Fallidas: ${context.purchaseStats.failed}

## INGREDIENTES CON COMPRAS FALLIDAS RECIENTES
${failedText}
${ordersStatsText}
${kitchenStatsText}
${warehouseStatsText}

## INSTRUCCIONES
Analiza el contexto y responde SOLO con un JSON válido (sin markdown, sin explicaciones):

{
  "recipeRanking": [
    {
      "recipe": "nombre de la receta",
      "viability": 85,
      "reason": "explicación corta de por qué es viable o no"
    }
  ],
  "criticalAlerts": [
    {
      "ingredient": "nombre del ingrediente",
      "urgency": "high",
      "suggestion": "qué acción tomar"
    }
  ]
}

REGLAS:
- viability es un número de 0 a 100 (100 = todos los ingredientes disponibles)
- urgency puede ser: "high" (stock 0), "medium" (stock bajo), "low" (advertencia)
- Ordena recipeRanking de mayor a menor viabilidad
- Solo incluye criticalAlerts para ingredientes con problemas reales
- Considera las recetas más preparadas y su tasa de éxito
- Considera los ingredientes con fallos de compra frecuentes
- Responde en español`;
}
