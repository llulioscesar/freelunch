# External Cron Setup para Kitchen Events Worker

Como Vercel Free Tier solo permite crons diarios, usamos un servicio externo gratuito para llamar al worker cada minuto.

## Servicio Recomendado: cron-job.org

**Free Tier incluye:**
- Hasta 50 cron jobs
- Intervalo mínimo: 1 minuto
- Monitoreo y logs
- Notificaciones por email

## Configuración

### 1. Crear cuenta en cron-job.org

Visita: https://cron-job.org/en/signup/

### 2. Crear Cron Job

Una vez desplegado el servicio en Vercel (Preview o Production):

1. **URL**: `https://your-orders-service.vercel.app/api/workers/kitchen-events`
2. **Title**: `Kitchen Events Worker - Orders Service`
3. **Schedule**: Every 1 minute
   - Type: `Every minute`
   - Pattern: `* * * * *`
4. **Request Method**: `GET`
5. **Timeout**: 30 seconds
6. **Enabled**: ✅

### 3. Configuración por Ambiente

#### Preview/Staging (test branch)
- URL: `https://your-orders-service-staging.vercel.app/api/workers/kitchen-events`
- Schedule: Every 1 minute

#### Production (main branch)
- URL: `https://your-orders-service.vercel.app/api/workers/kitchen-events`
- Schedule: Every 1 minute

### 4. Monitoreo

En cron-job.org puedes ver:
- Últimas ejecuciones
- Response time
- Status codes
- Logs de errores

## Alternativas

### GitHub Actions (también gratuita)

Si prefieres mantener todo en GitHub:

```yaml
# .github/workflows/kitchen-events-worker.yml
name: Kitchen Events Worker

on:
  schedule:
    - cron: '* * * * *'  # Every minute

jobs:
  trigger-worker:
    runs-on: ubuntu-latest
    steps:
      - name: Call worker endpoint
        run: |
          curl -X GET https://your-orders-service.vercel.app/api/workers/kitchen-events
```

**Nota**: GitHub Actions tiene límite de 2,000 minutos/mes en Free Tier
- 1 cron por minuto = 43,200 ejecuciones/mes
- Cada ejecución ~10 segundos = 7,200 minutos/mes ❌ **Excede el límite**

Por eso **cron-job.org es mejor** para este caso.

## Verificación

Para verificar que funciona:

```bash
# Llamar manualmente al endpoint
curl https://your-orders-service.vercel.app/api/workers/kitchen-events

# Respuesta esperada:
{
  "success": true,
  "processed": 0,
  "duration": 123,
  "timestamp": "2025-11-23T15:00:00.000Z"
}
```

## Logs

Vercel logs mostrará cada ejecución:
```
Kitchen events worker triggered
Pending messages found: 5
Worker execution completed in 234ms
```
