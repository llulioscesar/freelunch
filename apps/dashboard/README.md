# FreeLunch Dashboard

Panel de control para el sistema de donacion de comida FreeLunch.

## Descripcion

Dashboard web para gestionar y monitorear el sistema automatizado de donacion de comida. Permite visualizar ordenes, inventario, compras y recetas, ademas de interactuar con un asistente de IA.

## Solucion Propuesta

### Arquitectura Serverless

El proyecto utiliza una arquitectura **serverless** desplegada en **Vercel**, lo que permite:

- Escalado automatico segun demanda
- Cero administracion de servidores
- Despliegue continuo desde GitHub
- Edge functions para baja latencia

### Inteligencia Artificial con Gemini

Se implemento un asistente de IA usando **Google Gemini** que permite:

- **Consultas en lenguaje natural**: Preguntar sobre el estado del sistema
- **Creacion de ordenes**: "Crea una orden de 5 platos para Juan"
- **Gestion de inventario**: "Compra 10 unidades de tomato"
- **Resolucion de alertas**: Solicitar compra de ingredientes con stock bajo
- **Consulta de ordenes**: Buscar ordenes por cliente, ver detalles e historial

#### Herramientas del AI (Function Calling)

| Herramienta | Descripcion |
|-------------|-------------|
| `createOrder` | Crear nuevas ordenes de comida |
| `requestPurchase` | Solicitar compra de ingredientes |
| `getAlerts` | Obtener alertas criticas del sistema |
| `searchOrders` | Buscar ordenes por cliente o estado |
| `getOrderDetails` | Ver detalles completos de una orden |
| `getOrderHistory` | Ver historial de cambios de una orden |

## Stack Tecnologico

- **Framework**: React 19 + TanStack Router + TanStack Query
- **Estilos**: Tailwind CSS 4 + shadcn/ui
- **Build**: Vite 7
- **Despliegue**: Vercel (Serverless)
- **IA**: Google Gemini (Function Calling)

## Desarrollo

### Requisitos

- Node.js 18+
- npm 9+

### Instalacion

```bash
npm install
```

### Desarrollo local

```bash
npm run dev
```

La aplicacion estara disponible en `http://localhost:3000`

### Build de produccion

```bash
npm run build
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
npm run lint:fix  # Auto-fix
```

### Type checking

```bash
npm run typecheck
```

## Estructura del Proyecto

```
src/
├── components/       # Componentes React
│   ├── layout/       # Layout principal y sidebar
│   ├── ui/           # Componentes shadcn/ui
│   ├── FloatingChat.tsx  # Chat flotante con IA
│   └── LoginForm.tsx     # Formulario de login
├── hooks/            # Custom hooks (useOrders, useInventory, etc.)
├── lib/              # Utilidades (auth, utils)
├── routes/           # Rutas (file-based routing)
│   ├── index.tsx     # Dashboard principal
│   ├── orders.index.tsx  # Lista de ordenes
│   ├── orders.$orderId.tsx  # Detalle de orden
│   ├── inventory.tsx # Inventario
│   ├── purchases.tsx # Compras
│   ├── recipes.tsx   # Recetas
│   ├── ai.tsx        # Asistente IA
│   └── login.tsx     # Login
├── services/         # Servicios API
└── types/            # Tipos TypeScript
```

## Autenticacion (Demo)

Para acceder al dashboard en modo demo:

1. Email: Cualquier correo que termine en `@alegra.com`
2. Reto matematico: Resolver la operacion mostrada

## Variables de Entorno

```env
VITE_ORDERS_API_URL=http://localhost:3002
VITE_WAREHOUSE_API_URL=http://localhost:3001
VITE_KITCHEN_API_URL=http://localhost:3003
VITE_AI_API_URL=http://localhost:3004
```

## Licencia

Proyecto demo - FreeLunch 2025
