import { SystemContext } from '../types';

export function buildChatSystemPrompt(context: SystemContext): string {
  const inventoryText = context.inventory
    .map((i) => `- ${i.ingredientName}: ${i.quantity}`)
    .join('\n');

  const recipesText = context.recipes
    .map((r) => `- ${r.name}`)
    .join('\n');

  // Orders stats section
  let ordersSection = '';
  if (context.ordersStats) {
    ordersSection = `
### Estadísticas de órdenes
- Órdenes activas: ${context.ordersStats.orders.active}
- Órdenes completadas: ${context.ordersStats.orders.completed}
- Items en preparación: ${context.ordersStats.items.preparing}
- Items listos para entregar: ${context.ordersStats.items.ready}`;
  }

  // Kitchen stats section
  let kitchenSection = '';
  if (context.kitchenStats) {
    const mostPrepared = context.kitchenStats.recipes.mostPrepared
      .slice(0, 5)
      .map((r) => `- ${r.recipeName}: ${r.total} (${r.successRate}% éxito)`)
      .join('\n');

    kitchenSection = `
### Estadísticas de cocina
- Platos preparados: ${context.kitchenStats.plates.total}
- Listos: ${context.kitchenStats.plates.byStatus['READY'] || 0}
- Fallidos: ${context.kitchenStats.plates.byStatus['FAILED'] || 0}

### Recetas más preparadas
${mostPrepared || 'Sin datos'}`;
  }

  // Warehouse alerts section
  let warehouseSection = '';
  if (context.warehouseStats) {
    const lowStock = context.warehouseStats.inventory.lowStockItems
      .map((i) => `- ${i.ingredientName}: ${i.quantity}`)
      .join('\n');

    warehouseSection = `
### Alertas de almacén
- Sin stock: ${context.warehouseStats.inventory.outOfStock} ingredientes
- Stock bajo: ${context.warehouseStats.inventory.lowStock} ingredientes

### Ingredientes con stock bajo
${lowStock || 'Ninguno'}`;
  }

  return `Eres el asistente de FreeLunch, un sistema de donación de comida.
Ayudas al equipo de cocina a tomar decisiones sobre qué preparar.

## ESTADO ACTUAL DEL SISTEMA

### Inventario
${inventoryText || 'Sin datos'}

### Recetas disponibles
${recipesText || 'Sin datos'}

### Estadísticas de compras
- Total: ${context.purchaseStats.total}
- Exitosas: ${context.purchaseStats.successful}
- Fallidas: ${context.purchaseStats.failed}
- Tasa de éxito: ${context.purchaseStats.total > 0 ? Math.round((context.purchaseStats.successful / context.purchaseStats.total) * 100) : 0}%

### Ingredientes problemáticos (compras fallidas recientes)
${context.recentFailedPurchases.join(', ') || 'Ninguno'}
${ordersSection}
${kitchenSection}
${warehouseSection}

## INSTRUCCIONES
- Responde de forma concisa y útil
- Usa el contexto del sistema para dar respuestas precisas
- Si te preguntan qué cocinar, considera el inventario actual y las recetas más exitosas
- Si te preguntan sobre problemas, menciona los ingredientes con fallas o stock bajo
- Responde siempre en español
- Sé proactivo sugiriendo acciones cuando sea relevante`;
}

export function buildChatPrompt(systemPrompt: string, userMessage: string): string {
  return `${systemPrompt}

## PREGUNTA DEL USUARIO
${userMessage}

## TU RESPUESTA`;
}
