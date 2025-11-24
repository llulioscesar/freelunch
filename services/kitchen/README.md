# 🍳 Kitchen Service

Servicio de cocina para FreeLunch - Gestiona la asignación de recetas y preparación de platos.

## 🏗️ Arquitectura

Este servicio sigue **Arquitectura Hexagonal (Puertos y Adaptadores)** con **Domain-Driven Design (DDD)**:

```
kitchen/
├── domain/           # Lógica de negocio pura
│   ├── entities/     # Recipe, Plate
│   ├── value-objects/# PlateStatus, Ingredients, etc.
│   ├── events/       # Eventos de dominio
│   └── repositories/ # Interfaces (puertos)
│
├── application/      # Casos de uso
│   ├── use-cases/    # ProcessOrderUseCase, AssignRecipeUseCase, etc.
│   ├── dto/          # Data Transfer Objects
│   └── ports/        # EventPublisher, WarehouseClient
│
├── infrastructure/   # Implementaciones (adaptadores)
│   ├── adapters/
│   │   ├── persistence/  # Prisma repositories
│   │   ├── messaging/    # Redis Streams
│   │   └── http/         # Warehouse HTTP client
│   ├── consumers/    # Consumidores de eventos
│   ├── config/       # Dependency Injection
│   └── logging/      # Logger
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
GET  /                  # Health check
GET  /api/recipes       # Lista de recetas disponibles
GET  /api/plates        # Platos en preparación
POST /api/workers/order-consumer  # Worker para consumir eventos de Orders
```

## 🔄 Flujo de Eventos

1. **Orders** publica `OrderCreated` → Redis Stream `orders:events`
2. **Kitchen** consume evento vía `OrderEventsConsumer`
3. Kitchen crea `Plate` entities (uno por orderItem)
4. Kitchen asigna receta aleatoria
5. Kitchen solicita ingredientes a **Warehouse**
6. Kitchen publica `PlateReady` → Redis Stream `kitchen:events`
7. **Orders** consume `PlateReady` y actualiza estado

## 📚 Recetas Disponibles

El servicio gestiona **6 recetas** con ingredientes del pool:
- tomato, lemon, potato, rice, ketchup
- lettuce, onion, cheese, meat, chicken

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

### Configuración en `prisma.config.ts`
```typescript
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

### PostgreSQL Adapter
```typescript
import { PrismaClient } from './src/generated/prisma/client/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

**Importante**: El cliente de Prisma se genera en `src/generated/prisma/client/client.js`

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
