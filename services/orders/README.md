# Orders Service

Servicio de gestión de pedidos para el sistema FreeLunch.

## 📋 Descripción

Este microservicio maneja:
- Creación de nuevos pedidos
- Listado y consulta de pedidos
- Actualización de estado de pedidos
- Emisión de eventos para iniciar el flujo de preparación

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores
```

## 🔧 Desarrollo Local

```bash
# Iniciar en modo desarrollo (puerto 3001)
npm run dev

# Ejecutar tests
npm test

# Linting
npm run lint
```

## 📡 API Endpoints

### Health Check
```http
GET /api
```

### Crear Pedido
```http
POST /api/create
Content-Type: application/json

{
  "quantity": 5,
  "customerName": "Juan", // opcional
  "notes": "Sin cebolla"   // opcional
}
```

### Listar Pedidos
```http
GET /api/list?page=1&limit=10&status=PENDING
```

### Obtener Estado de Pedido
```http
GET /api/status?id=ORD-123456
```

### Actualizar Estado (interno)
```http
PATCH /api/status?id=ORD-123456
Content-Type: application/json

{
  "status": "READY",
  "completedAt": "2024-01-01T12:00:00Z"
}
```

## 📤 Eventos Emitidos

- `ORDER_CREATED` → Kitchen Service
  - Se emite cuando se crea un nuevo pedido
  - Inicia el flujo de preparación

## 📥 Eventos Recibidos

- `DISH_PREPARED` ← Kitchen Service
  - Actualiza el estado del pedido a READY

## 🔐 Variables de Entorno

```env
DATABASE_URL=              # PostgreSQL connection string
QSTASH_TOKEN=             # Token de autenticación QStash
KITCHEN_SERVICE_URL=      # URL del Kitchen Service
SERVICE_NAME=orders-service
NODE_ENV=development
PORT=3001
```

## 🏗️ Arquitectura

Este servicio:
1. Actúa como punto de entrada del sistema
2. Orquesta el inicio del flujo de pedidos
3. Mantiene el estado principal de cada pedido
4. Se comunica de forma asíncrona mediante eventos

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Test manual con curl
curl -X POST http://localhost:3001/api/create \
  -H "Content-Type: application/json" \
  -d '{"quantity": 2}'
```

## 📦 Despliegue

```bash
# Desplegar a producción
npm run deploy
```

El servicio se desplegará automáticamente en Vercel.