# AI Service

Servicio de inteligencia artificial para FreeLunch usando Google Gemini.

## Descripcion

Proporciona un asistente conversacional que permite interactuar con el sistema en lenguaje natural mediante Function Calling de Gemini.

## Funcionalidades

### Chat Conversacional
- Interaccion en lenguaje natural
- Ejecucion de acciones mediante Function Calling
- Contexto del sistema (inventario, ordenes, alertas)

### Function Calling (Tools)

| Herramienta | Descripcion |
|-------------|-------------|
| `createOrder` | Crear nuevas ordenes de comida |
| `requestPurchase` | Solicitar compra de ingredientes |
| `getAlerts` | Obtener alertas criticas del sistema |
| `searchOrders` | Buscar ordenes por cliente o estado |
| `getOrderDetails` | Ver detalles completos de una orden |
| `getOrderHistory` | Ver historial de cambios de una orden |

### Recomendaciones
- Alertas de stock bajo y sin stock
- Sugerencias de recetas basadas en inventario
- Prediccion de ingredientes necesarios

## API Endpoints

```http
POST /api/chat              # Chat conversacional con IA
GET  /api/recommendations   # Obtener recomendaciones y alertas
GET  /api/health            # Health check del servicio
```

## Estructura

```
ai/
├── api/
│   ├── chat.ts              # Endpoint de chat
│   ├── recommendations.ts   # Endpoint de recomendaciones
│   └── health.ts            # Health check
├── src/
│   ├── clients/             # Clientes para otros servicios
│   │   ├── gemini.ts        # Cliente Google Gemini
│   │   ├── orders.ts        # Cliente servicio Orders
│   │   ├── kitchen.ts       # Cliente servicio Kitchen
│   │   └── warehouse.ts     # Cliente servicio Warehouse
│   ├── prompts/             # System prompts
│   │   ├── chat.ts          # Prompt para chat
│   │   └── recommendations.ts # Prompt para recomendaciones
│   ├── tools/               # Function calling
│   │   ├── definitions.ts   # Definiciones de tools
│   │   └── executor.ts      # Ejecutor de tools
│   ├── context.ts           # Contexto del sistema
│   └── types.ts             # Tipos TypeScript
└── vercel.json
```

## Variables de Entorno

```env
GEMINI_API_KEY=...           # API Key de Google Gemini
ORDERS_API_URL=...           # URL del servicio Orders
KITCHEN_API_URL=...          # URL del servicio Kitchen
WAREHOUSE_API_URL=...        # URL del servicio Warehouse
```

## Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local (puerto 3004)
npm run dev

# Tests
npm run test

# Lint
npm run lint
```

## Stack

- Google Gemini API
- Vercel Serverless Functions
- TypeScript
