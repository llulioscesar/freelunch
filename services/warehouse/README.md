# 📦 Warehouse Service

Servicio de bodega para FreeLunch - Gestiona el inventario de ingredientes y compras en la plaza de mercado.

## 🏗️ Arquitectura

Este servicio sigue **Arquitectura Hexagonal (Puertos y Adaptadores)** con **Domain-Driven Design (DDD)**:

```
warehouse/
├── domain/           # Lógica de negocio pura
│   ├── entities/     # InventoryItem, Purchase
│   ├── value-objects/# IngredientName, Quantity, etc.
│   ├── events/       # Eventos de dominio
│   └── repositories/ # Interfaces (puertos)
│
├── application/      # Casos de uso
│   ├── use-cases/    # ProcessIngredientRequest, GetInventory, etc.
│   ├── dto/          # Data Transfer Objects
│   └── ports/        # MarketClient, KitchenClient, EventPublisher
│
├── infrastructure/   # Implementaciones (adaptadores)
│   ├── adapters/
│   │   ├── persistence/  # Prisma repositories
│   │   ├── messaging/    # Redis Streams (KitchenClient)
│   │   ├── http/         # HttpMarketClient (plaza de mercado)
│   │   └── cache/        # Redis client
│   ├── consumers/    # KitchenRequestsConsumer
│   ├── config/       # Dependency Injection
│   ├── logging/      # Logger
│   └── metrics/      # MetricsService (Prometheus-style)
│
└── presentation/     # API REST
    └── api/          # Endpoints serverless
```

## 🚀 Tecnologías

- **Node.js 20+** con ES Modules
- **TypeScript 5.7+**
- **Prisma ORM v7** con PostgreSQL Adapter
- **Upstash Redis** (Redis Streams)
- **Vercel Serverless Functions**
- **Jest** para testing

## 📦 Instalación

```bash
npm install
```

## ⚙️ Configuración

Copia `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Variables requeridas:
- `DATABASE_URL`: PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL`: Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis token
- `MARKET_API_URL`: URL de la plaza de mercado

## 🗄️ Base de Datos (Prisma v7)

### Generar Prisma Client

```bash
npm run prisma:generate
```

### Crear migración

```bash
npm run prisma:migrate
```

### Deploy migraciones (producción)

```bash
npm run prisma:deploy
```

### Abrir Prisma Studio

```bash
npm run prisma:studio
```

## 🔧 Desarrollo

```bash
# Modo watch
npm run dev

# Build
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

## 🧪 Testing

```bash
# Todos los tests con coverage
npm test

# Solo tests unitarios
npm run test:unit

# Solo tests de integración
npm run test:integration

# Solo tests e2e
npm run test:e2e

# Watch mode
npm run test:watch
```

## 📡 API Endpoints

```
GET  /                           # Health check
GET  /api/inventory              # Estado del inventario
POST /api/inventory              # Inicializar inventario con stock default
GET  /api/purchases              # Historial de compras en la plaza
GET  /api/metrics                # Métricas del servicio (JSON o Prometheus)
POST /api/workers/kitchen-consumer  # Worker para procesar solicitudes de Kitchen
```

### Inventario

**GET /api/inventory**
```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "...", "ingredientName": "tomato", "quantity": 5, ... },
      { "id": "...", "ingredientName": "cheese", "quantity": 3, ... }
    ],
    "totalItems": 10,
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
```

**POST /api/inventory** - Inicializa inventario con 5 unidades de cada ingrediente

### Historial de Compras

**GET /api/purchases?limit=100**
```json
{
  "success": true,
  "data": {
    "purchases": [
      {
        "id": "...",
        "ingredientName": "tomato",
        "requestedQuantity": 2,
        "obtainedQuantity": 3,
        "status": "completed",
        ...
      }
    ],
    "total": 50,
    "successful": 45,
    "failed": 5
  }
}
```

## 🔄 Flujo de Eventos

1. **Kitchen** solicita ingredientes → Redis Stream `warehouse:requests`
2. **Warehouse** consume solicitud vía `KitchenRequestsConsumer`
3. Warehouse verifica inventario
4. Si faltan ingredientes, compra en la **Plaza de Mercado**
5. Warehouse reserva (descuenta) ingredientes del inventario
6. Warehouse responde a Kitchen → Redis Stream `warehouse:responses`
7. **Kitchen** continúa preparación del plato

## 🛒 Plaza de Mercado

El servicio compra ingredientes de la API externa:
```
GET https://recruitment.alegra.com/api/farmers-market/buy?ingredient=tomato
```

Respuesta:
```json
{ "quantitySold": 3 }
```

**Ingredientes válidos:**
- tomato, lemon, potato, rice, ketchup
- lettuce, onion, cheese, meat, chicken

## 📊 Inventario Inicial

El servicio inicia con **5 unidades** de cada ingrediente:
- tomato: 5
- lemon: 5
- potato: 5
- rice: 5
- ketchup: 5
- lettuce: 5
- onion: 5
- cheese: 5
- meat: 5
- chicken: 5

## 🚢 Despliegue en Vercel

```bash
vercel
```

El servicio se despliega automáticamente con:
- Prisma migrations via `buildCommand`
- Serverless functions en `/api/*`
- Variables de entorno configuradas en Vercel

## 📝 Prisma ORM v7 - Cambios Importantes

Este proyecto usa **Prisma ORM v7** con las siguientes configuraciones:

### ESM (ES Modules)
- `package.json` incluye `"type": "module"`
- `tsconfig.json` configurado con `module: "ESNext"`

### Nuevo Provider
```prisma
generator client {
  provider = "prisma-client"  // Nuevo en v7
}
```

### Modelos
```prisma
model InventoryItem {
  id              String   @id @default(cuid())
  ingredientName  String   @unique
  quantity        Int      @default(5)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Purchase {
  id                String    @id @default(cuid())
  ingredientName    String
  requestedQuantity Int
  obtainedQuantity  Int       @default(0)
  status            String    @default("pending")
  plateId           String?
  orderId           String?
  errorMessage      String?
  createdAt         DateTime  @default(now())
  completedAt       DateTime?
}
```

### Primera vez - Setup completo

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# 3. Generar Prisma Client
npm run prisma:generate

# 4. Ejecutar migraciones
npm run prisma:migrate

# 5. Verificar tipos
npm run typecheck

# 6. Ejecutar tests
npm test
```

## 🤝 Contribuir

Este servicio es parte del sistema FreeLunch. Ver el README principal del monorepo para guías de contribución.

## 📄 Licencia

MIT © StartCodex
