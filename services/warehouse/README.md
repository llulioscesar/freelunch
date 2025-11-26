# Warehouse Service

Servicio de bodega para FreeLunch - Gestiona el inventario de ingredientes y compras en la plaza de mercado.

## Descripcion

- Recibe solicitudes de ingredientes desde Kitchen Service
- Verifica disponibilidad en inventario
- Compra automaticamente en Farmers Market API si falta stock
- Reserva (descuenta) ingredientes del inventario
- Responde a Kitchen con resultado de disponibilidad

## API Endpoints

```http
GET  /api                              # Health check
GET  /api/inventory                    # Estado del inventario
POST /api/inventory                    # Inicializar inventario (5 unidades c/u)
GET  /api/purchases                    # Historial de compras
GET  /api/stats                        # Estadisticas de warehouse
POST /api/request-purchase             # Compra manual (para IA)
POST /api/workers/kitchen-consumer     # Worker cron - procesa solicitudes
```

### Compra Manual (para IA)
```http
POST /api/request-purchase
Content-Type: application/json

{
  "ingredientName": "tomato",
  "quantity": 10
}
```

## Arquitectura

```
src/
├── domain/                 # Nucleo del negocio
│   ├── entities/           # InventoryItem, Purchase
│   ├── value-objects/      # IngredientName, Quantity, InventoryItemId, PurchaseId
│   ├── events/             # IngredientsReserved, IngredientsUnavailable, PurchaseCompleted
│   └── repositories/       # Interfaces
│
├── application/            # Casos de uso
│   ├── use-cases/          # ProcessIngredientRequest, GetInventory, RequestPurchase
│   ├── dto/                # InventoryDTO, IngredientsRequestDTO, PurchaseDTO
│   └── ports/              # MarketClient, KitchenClient, EventPublisher
│
├── infrastructure/         # Adaptadores
│   ├── adapters/
│   │   ├── persistence/    # PrismaInventoryRepository, PrismaPurchaseRepository
│   │   ├── messaging/      # RedisKitchenClient, RedisStreamEventPublisher
│   │   ├── http/           # HttpMarketClient (Farmers Market API)
│   │   └── cache/          # RedisClient
│   ├── consumers/          # KitchenRequestsConsumer
│   └── config/             # Dependencies (DI)
│
└── presentation/           # API handlers
    └── api/
```

## Flujo de Procesamiento

```
1. Kitchen solicita ingredientes → stream:warehouse:requests
2. KitchenRequestsConsumer procesa la solicitud
3. ProcessIngredientRequestUseCase:
   a. Para cada ingrediente:
      - Verificar stock en inventario
      - Si falta → comprar en Farmers Market (max 10 intentos)
      - Reservar (descontar) del inventario
   b. Enviar respuesta a Kitchen
4. Respuesta → stream:warehouse:responses
```

## Eventos

### Eventos Emitidos (stream:warehouse:responses)

| Evento | Datos | Descripcion |
|--------|-------|-------------|
| `warehouse.ingredients.reserved` | plateId, orderItemId, ingredients | Ingredientes reservados exitosamente |
| `warehouse.ingredients.unavailable` | plateId, orderItemId, unavailableIngredients, reason | No se pudo obtener ingredientes |
| `warehouse.purchase.completed` | purchaseId, ingredientName, obtainedQuantity | Compra en market completada |

### Eventos Consumidos (stream:warehouse:requests)

| Evento | Accion |
|--------|--------|
| `kitchen.ingredients.requested` | Procesar solicitud de ingredientes |

## Consumer Worker

- **Stream**: `stream:warehouse:requests`
- **Consumer Group**: `warehouse-service`
- **Endpoint**: `POST /api/workers/kitchen-consumer`

Configurar cron en Vercel:
```json
{
  "crons": [{
    "path": "/api/workers/kitchen-consumer",
    "schedule": "* * * * *"
  }]
}
```

## Farmers Market API

Compra ingredientes de la API externa:
```
GET https://recruitment.alegra.com/api/farmers-market/buy?ingredient=tomato
```

Respuesta:
```json
{ "quantitySold": 3 }
```

**Ingredientes validos:**
- tomato, lemon, potato, rice, ketchup
- lettuce, onion, cheese, meat, chicken

## Variables de Entorno

### Requeridas
```env
DATABASE_URL=postgresql://...              # Neon PostgreSQL
UPSTASH_REDIS_REST_URL=https://...         # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN=your_token        # Upstash Redis REST Token
MARKET_API_URL=https://recruitment.alegra.com/api/farmers-market/buy
```

### Opcionales (tienen defaults)
```env
WAREHOUSE_REQUESTS_STREAM=stream:warehouse:requests
WAREHOUSE_RESPONSES_STREAM=stream:warehouse:responses
WAREHOUSE_CONSUMER_GROUP=warehouse-service
KITCHEN_REQUESTS_BATCH_SIZE=50
NODE_ENV=development
LOG_LEVEL=info
```

## Inventario Inicial

El servicio inicia con 5 unidades de cada ingrediente:
- tomato, lemon, potato, rice, ketchup
- lettuce, onion, cheese, meat, chicken

## Desarrollo

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run prisma:generate

# Desarrollo local (puerto 3002)
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
