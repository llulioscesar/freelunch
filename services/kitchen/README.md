# Kitchen Service

Servicio de cocina para FreeLunch - Gestiona la asignacion de recetas y preparacion de platos.

## Descripcion

- Recibe eventos de ordenes desde Orders Service
- Crea platos (Plates) para cada item de la orden
- Asigna recetas aleatorias a cada plato
- Solicita ingredientes a Warehouse Service
- Procesa respuestas de disponibilidad de ingredientes
- Emite eventos de progreso de preparacion

## API Endpoints

```http
GET  /api                              # Health check
GET  /api/recipes                      # Lista de recetas disponibles
GET  /api/plates                       # Platos en preparacion
GET  /api/history?plateId=PLT-xxx      # Historial de un plato
GET  /api/stats                        # Estadisticas de cocina
GET  /api/metrics                      # Metricas (JSON o Prometheus)
POST /api/workers/order-consumer       # Worker cron - consume ordenes
POST /api/workers/warehouse-consumer   # Worker cron - consume respuestas warehouse
```

## Arquitectura

```
src/
├── domain/                 # Nucleo del negocio
│   ├── entities/           # Recipe, Plate
│   ├── value-objects/      # PlateId, PlateStatus, RecipeId, Ingredients
│   ├── events/             # PlateAssigned, IngredientsRequested, PlateReady, PlateFailed
│   └── repositories/       # Interfaces
│
├── application/            # Casos de uso
│   ├── use-cases/          # ProcessOrder, AssignRecipe, RequestIngredients
│   ├── dto/                # PlateDTO, RecipeDTO, ProcessOrderDTO
│   └── ports/              # EventPublisher, WarehouseClient
│
├── infrastructure/         # Adaptadores
│   ├── adapters/
│   │   ├── persistence/    # PrismaPlateRepository, PrismaRecipeRepository
│   │   ├── messaging/      # RedisStreamEventPublisher, RedisWarehouseClient
│   │   └── cache/          # RedisClient
│   ├── consumers/          # OrderEventsConsumer, WarehouseResponsesConsumer
│   └── config/             # Dependencies (DI)
│
└── presentation/           # API handlers
    └── api/
```

## Estados del Plato

```
PENDING → ASSIGNED → REQUESTING_INGREDIENTS → COOKING → READY
    ↓         ↓              ↓                   ↓
 FAILED    FAILED         FAILED              FAILED
```

## Eventos

### Eventos Emitidos

| Stream | Evento | Datos | Descripcion |
|--------|--------|-------|-------------|
| `stream:kitchen:events` | `kitchen.plate.assigned` | plateId, orderId, recipeId, ingredients | Receta asignada |
| `stream:warehouse:requests` | `kitchen.ingredients.requested` | plateId, orderId, recipeId, ingredients | Solicitud de ingredientes |
| `stream:kitchen:events` | `kitchen.plate.cooking` | plateId, cookingStartedAt | Inicio de coccion |
| `stream:kitchen:events` | `kitchen.plate.ready` | plateId, readyAt, preparationTimeSeconds | Plato listo |
| `stream:kitchen:events` | `kitchen.plate.failed` | plateId, reason | Plato fallido |

### Eventos Consumidos

| Stream | Evento | Accion |
|--------|--------|--------|
| `stream:orders:events` | `order.created` | Crear plates, asignar recetas, solicitar ingredientes |
| `stream:warehouse:responses` | `ingredients.reserved` | Iniciar coccion → Marcar como listo |
| `stream:warehouse:responses` | `ingredients.unavailable` | Marcar plato como fallido |

## Consumer Workers

### Order Consumer
- **Stream**: `stream:orders:events`
- **Consumer Group**: `kitchen-service`
- **Endpoint**: `POST /api/workers/order-consumer`

### Warehouse Consumer
- **Stream**: `stream:warehouse:responses`
- **Consumer Group**: `kitchen-service`
- **Endpoint**: `POST /api/workers/warehouse-consumer`

Configurar crons en Vercel:
```json
{
  "crons": [
    { "path": "/api/workers/order-consumer", "schedule": "* * * * *" },
    { "path": "/api/workers/warehouse-consumer", "schedule": "* * * * *" }
  ]
}
```

## Variables de Entorno

### Requeridas
```env
DATABASE_URL=postgresql://...              # Neon PostgreSQL
UPSTASH_REDIS_REST_URL=https://...         # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN=your_token        # Upstash Redis REST Token
```

### Opcionales (tienen defaults)
```env
ORDERS_EVENTS_STREAM=stream:orders:events
KITCHEN_EVENTS_STREAM=stream:kitchen:events
KITCHEN_CONSUMER_GROUP=kitchen-service
WAREHOUSE_REQUESTS_STREAM=stream:warehouse:requests
WAREHOUSE_RESPONSES_STREAM=stream:warehouse:responses
NODE_ENV=development
LOG_LEVEL=info
```

## Desarrollo

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run prisma:generate

# Desarrollo local (puerto 3003)
npm run dev

# Tests
npm test
npm run test:coverage

# Lint y tipos
npm run lint
npm run typecheck
```

## Recetas Disponibles

El servicio gestiona 6 recetas con ingredientes del pool:
- tomato, lemon, potato, rice, ketchup
- lettuce, onion, cheese, meat, chicken

## Stack

- Vercel Serverless Functions
- PostgreSQL (Neon) + Prisma
- Redis Streams (Upstash)
- TypeScript
