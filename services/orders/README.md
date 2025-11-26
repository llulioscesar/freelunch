# Orders Service

Servicio de gestion de pedidos con Arquitectura Hexagonal y Domain-Driven Design.

## Descripcion

Maneja el ciclo de vida completo de los pedidos:
- Creacion de ordenes con multiples platos (OrderItems)
- Tracking individual de cada plato
- Actualizacion de estado basada en eventos de Kitchen
- Progreso en tiempo real

## API Endpoints

```http
GET  /api                       # Health check
POST /api/create                # Crear orden
GET  /api/list                  # Listar ordenes (paginado)
GET  /api/status?id=ORD-xxx     # Estado de una orden
GET  /api/history?id=ORD-xxx    # Historial de cambios
GET  /api/stats                 # Estadisticas generales
GET  /api/metrics               # Metricas del servicio
POST /api/workers/kitchen-events # Worker cron (interno)
```

### Crear Orden
```http
POST /api/create
Content-Type: application/json

{
  "quantity": 5,
  "customerName": "Juan",  // opcional
  "notes": "Sin cebolla"   // opcional
}
```

### Listar Ordenes
```http
GET /api/list?page=1&limit=10&status=PENDING
```

## Arquitectura

```
src/
├── domain/                 # Nucleo del negocio
│   ├── entities/           # Order, OrderItem
│   ├── value-objects/      # OrderId, OrderStatus, Quantity, CustomerInfo
│   ├── events/             # OrderCreated, OrderCompleted, OrderFailed
│   └── repositories/       # Interfaces
│
├── application/            # Casos de uso
│   ├── use-cases/          # CreateOrder, ListOrders, UpdateOrderItemStatus
│   ├── dto/                # CreateOrderDTO
│   └── ports/              # EventPublisher interface
│
├── infrastructure/         # Adaptadores
│   ├── adapters/
│   │   ├── persistence/    # PrismaOrderRepository, CachedOrderRepository
│   │   ├── messaging/      # RedisStreamEventPublisher
│   │   └── cache/          # RedisClient
│   ├── consumers/          # KitchenEventsConsumer
│   └── config/             # Dependencies (DI)
│
└── presentation/           # API handlers
    └── api/                # create, list, status, history
```

## Estados

### Order Status
```
PENDING → PREPARING → INGREDIENTS_REQUESTED → COOKING → READY → DELIVERED
                                    ↓                      ↓
                                 FAILED                  FAILED
```

### OrderItem Status
```
PENDING → ASSIGNED → INGREDIENTS_REQUESTED → COOKING → READY → DELIVERED
                              ↓                  ↓
                           FAILED             FAILED
```

## Eventos

### Eventos Emitidos (stream:orders:events)

| Evento | Datos | Descripcion |
|--------|-------|-------------|
| `order.created` | orderId, quantity, customerName, items[] | Nueva orden creada |
| `order.status.changed` | orderId, previousStatus, newStatus | Cambio de estado |
| `order.completed` | orderId, completedAt, preparationTimeMinutes | Orden completada |
| `order.failed` | orderId, reason, failedAt | Orden fallida |

### Eventos Consumidos (stream:kitchen:events)

| Evento | Accion |
|--------|--------|
| `kitchen.plate.assigned` | OrderItem → ASSIGNED |
| `kitchen.ingredients.requested` | OrderItem → INGREDIENTS_REQUESTED |
| `kitchen.plate.cooking` | OrderItem → COOKING |
| `kitchen.plate.ready` | OrderItem → READY |
| `kitchen.plate.failed` | OrderItem → FAILED |

## Consumer Worker

El servicio consume eventos de Kitchen via Redis Streams:

- **Stream**: `stream:kitchen:events`
- **Consumer Group**: `orders-service`
- **Endpoint**: `POST /api/workers/kitchen-events`

Configurar cron en Vercel para ejecutar cada minuto:
```json
{
  "crons": [{
    "path": "/api/workers/kitchen-events",
    "schedule": "* * * * *"
  }]
}
```

## Variables de Entorno

### Requeridas
```env
DATABASE_URL=postgresql://...           # Neon PostgreSQL
REDIS_URL=https://...upstash.io         # Upstash Redis REST URL
REDIS_TOKEN=your_token                  # Upstash Redis REST Token
```

### Opcionales
```env
SERVICE_NAME=orders-service             # Nombre del servicio (default: orders-service)
NODE_ENV=development                    # development | production | test
LOG_LEVEL=info                          # trace | debug | info | warn | error | fatal
```

> Alternativa: Puedes usar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en lugar de `REDIS_URL` y `REDIS_TOKEN`

## Desarrollo

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run db:generate

# Desarrollo local (puerto 3001)
npm run dev

# Tests
npm test
npm run test:coverage

# Lint y tipos
npm run lint
npm run typecheck
```

## Stack

- Vercel Serverless Functions
- PostgreSQL (Neon) + Prisma
- Redis Streams (Upstash)
- TypeScript
