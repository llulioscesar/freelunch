# 🚀 Configuración de Vercel - Múltiples Ambientes

## Respuesta a tu Pregunta: ¿Vercel soporta Staging y Production?

**✅ SÍ**, Vercel soporta múltiples ambientes perfectamente. Aquí está cómo configurarlo:

## 🎯 Ambientes en Vercel

Vercel maneja 3 tipos de despliegues:

```
┌─────────────────────────────────────────────────────────────┐
│                    AMBIENTES VERCEL                         │
└─────────────────────────────────────────────────────────────┘

1. Production    → rama 'main'
   URL: https://freelunch.com

2. Preview       → rama 'test' (configurado como staging)
   URL: https://test-freelunch.vercel.app

3. Preview       → otras ramas/PRs
   URL: https://pr-123-freelunch.vercel.app
```

## 📋 Configuración Paso a Paso

### Paso 1: Importar Proyecto en Vercel

```bash
# Opción A: Desde la Web UI
1. Ve a https://vercel.com/new
2. Conecta tu repositorio GitHub
3. Selecciona: llulioscesar/freelunch
4. Click "Import"

# Opción B: Desde CLI
npm i -g vercel
vercel login
vercel --cwd services/orders
```

### Paso 2: Configurar Ramas de Producción

En Vercel Dashboard:

```
Settings → Git
  ├── Production Branch: main          ✅
  ├── Enable automatic deployments     ✅
  └── Deploy Hooks:
      ├── test branch → Preview (staging)
      └── otros → Preview
```

**Configuración JSON:**
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,    // ← Production
      "test": true     // ← Staging (Preview)
    }
  }
}
```

### Paso 3: Configurar Variables de Ambiente

#### 🟢 Production (rama main)

```
Settings → Environment Variables → Production

NODE_ENV                = production
SERVICE_NAME            = orders-service
PRISMA_DATABASE_URL     = postgresql://...prod...
REDIS_URL               = https://prod-redis.upstash.io
REDIS_TOKEN             = [secret]
QSTASH_TOKEN            = [secret]
KITCHEN_SERVICE_URL     = https://kitchen.freelunch.com
LOG_LEVEL               = info
METRICS_ENABLED         = true
```

#### 🟡 Staging (rama test)

```
Settings → Environment Variables → Preview

NODE_ENV                = staging
SERVICE_NAME            = orders-service-staging
PRISMA_DATABASE_URL     = postgresql://...staging...
REDIS_URL               = https://staging-redis.upstash.io
REDIS_TOKEN             = [secret-staging]
QSTASH_TOKEN            = [secret-staging]
KITCHEN_SERVICE_URL     = https://kitchen-staging.freelunch.com
LOG_LEVEL               = debug
METRICS_ENABLED         = true
```

#### 🔵 Preview (PRs y otras ramas)

```
Settings → Environment Variables → Preview

NODE_ENV                = development
SERVICE_NAME            = orders-service-preview
PRISMA_DATABASE_URL     = postgresql://...dev...
REDIS_URL               = https://dev-redis.upstash.io
REDIS_TOKEN             = [secret-dev]
LOG_LEVEL               = debug
METRICS_ENABLED         = false
```

### Paso 4: Configurar Dominios

#### Production:
```
Settings → Domains
  ├── Add Domain: orders.freelunch.com     (Primary)
  └── Branch: main
```

#### Staging:
```
Settings → Domains
  ├── Add Domain: orders-staging.freelunch.com
  └── Branch: test

O usar el dominio automático:
  └── https://test-freelunch.vercel.app
```

## 🔄 Flujo de Deployment Automático

### Caso 1: Push a rama main (Production)

```bash
git checkout main
git merge test
git push origin main

# Vercel automáticamente:
✅ Detecta push a main
✅ Usa variables de Production
✅ Build con NODE_ENV=production
✅ Deploy a https://orders.freelunch.com
✅ Ejecuta health checks
```

### Caso 2: Push a rama test (Staging)

```bash
git checkout test
git merge dev
git push origin test

# Vercel automáticamente:
✅ Detecta push a test
✅ Usa variables de Preview (staging)
✅ Build con NODE_ENV=staging
✅ Deploy a https://orders-staging.freelunch.com
✅ Ejecuta smoke tests
```

### Caso 3: PR a dev (Preview)

```bash
git push origin feature/new-feature

# Vercel automáticamente:
✅ Detecta nuevo commit
✅ Usa variables de Preview (dev)
✅ Build con NODE_ENV=development
✅ Deploy a https://pr-123-freelunch.vercel.app
✅ Comenta URL en el PR
```

## 📊 Comparación de Ambientes

| Característica | Production | Staging | Preview (PRs) |
|----------------|-----------|---------|---------------|
| **Rama** | main | test | feature/* |
| **URL** | freelunch.com | staging.freelunch.com | pr-123.vercel.app |
| **NODE_ENV** | production | staging | development |
| **Database** | Prod DB | Staging DB | Dev DB |
| **Redis** | Prod Redis | Staging Redis | Dev Redis |
| **Log Level** | info | debug | debug |
| **Crons** | ✅ Enabled | ✅ Enabled | ❌ Disabled |
| **Analytics** | ✅ Full | ✅ Full | ⚠️ Limited |
| **Auto Deploy** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Manual Approval** | ⚠️ Vía PR | ⚠️ Vía PR | ❌ No |

## 🛠️ Comandos Útiles

### Ver deployments

```bash
# Listar últimos deployments
vercel ls

# Ver detalles de un deployment
vercel inspect <deployment-url>

# Ver logs en tiempo real
vercel logs <deployment-url> --follow
```

### Deploy manual (si necesitas)

```bash
# Deploy a production
vercel --prod

# Deploy a preview (staging)
vercel

# Deploy con variables específicas
vercel --env NODE_ENV=staging
```

### Promover deployment

```bash
# Promover un preview a production
vercel promote <deployment-url>
```

### Rollback

```bash
# Listar deployments de production
vercel ls --prod

# Promover un deployment anterior
vercel promote <previous-deployment-url>
```

## 📱 Notificaciones

### Configurar Slack/Discord

```
Settings → Notifications
  ├── Deployment Started    → #deployments
  ├── Deployment Failed     → #alerts
  ├── Deployment Succeeded  → #deployments
  └── Production Only       ✅
```

### GitHub Status Checks

```
Settings → Git Integration
  ├── Enable checks on Pull Requests    ✅
  ├── Include Deployment URL            ✅
  └── Block merge if deployment fails   ✅
```

## 🔐 Secrets Management

### Opción 1: Vercel Dashboard (Recomendado)

```
Settings → Environment Variables
  ├── Name: REDIS_TOKEN
  ├── Value: [paste secret]
  ├── Environment: Production ✅
  └── Save
```

### Opción 2: Vercel CLI

```bash
# Agregar secret a production
vercel env add REDIS_TOKEN production

# Agregar secret a preview (staging)
vercel env add REDIS_TOKEN preview

# Listar todas las env vars
vercel env ls
```

### Opción 3: Desde GitHub Secrets + Actions

```yaml
# En .github/workflows/ci.yml
- name: Deploy to Vercel
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    REDIS_TOKEN: ${{ secrets.REDIS_TOKEN }}
  run: |
    vercel --token $VERCEL_TOKEN \
           --env REDIS_TOKEN=$REDIS_TOKEN \
           --prod
```

## 🎯 Mejores Prácticas

### 1. Usar diferentes bases de datos

```
Production → PostgreSQL en Vercel Postgres
Staging    → PostgreSQL en Vercel Postgres (otra instancia)
Preview    → PostgreSQL local o Neon.tech (gratis)
```

### 2. Usar diferentes instancias de Redis

```
Production → Upstash Redis (plan Pro)
Staging    → Upstash Redis (plan Free, otra instancia)
Preview    → Redis local o Upstash Free
```

### 3. Rate Limiting diferente por ambiente

```javascript
// src/infrastructure/config/rate-limit.ts
const limits = {
  production: { max: 100, window: '1m' },
  staging: { max: 1000, window: '1m' },
  development: { max: 10000, window: '1m' },
};

export const rateLimit = limits[process.env.NODE_ENV];
```

### 4. Feature Flags por ambiente

```javascript
// src/infrastructure/config/features.ts
export const features = {
  newMetrics: process.env.NODE_ENV !== 'production',
  betaUI: process.env.NODE_ENV === 'staging',
  debugMode: process.env.NODE_ENV === 'development',
};
```

## 🔍 Monitoreo

### Production

```
Settings → Analytics
  ├── Enable Web Analytics      ✅
  ├── Enable Speed Insights      ✅
  └── Enable Log Drains          ✅
```

### Staging

```
Settings → Analytics
  ├── Enable Web Analytics      ✅
  ├── Enable Speed Insights      ⚠️ (opcional)
  └── Enable Log Drains          ✅
```

## 🚨 Troubleshooting

### Deployment falla en Vercel

```bash
# Ver logs del deployment
vercel logs <deployment-url> --follow

# Problemas comunes:
1. Build command incorrecta → Verificar vercel.json
2. Env vars faltantes → Verificar Settings → Environment Variables
3. Timeout → Aumentar maxDuration en vercel.json
4. Memory → Aumentar memory en vercel.json
```

### Variables no se cargan

```bash
# Verificar que existen
vercel env ls

# Verificar scope correcto
Production vars → solo en production
Preview vars → solo en preview/staging

# Re-deploy para aplicar nuevas vars
vercel --prod --force
```

### Dominio no funciona

```bash
# Verificar DNS
dig orders.freelunch.com

# Debe apuntar a:
CNAME → cname.vercel-dns.com

# O A record →
76.76.21.21
```

## 📝 Checklist de Configuración

- [ ] Proyecto importado en Vercel
- [ ] Production branch = `main`
- [ ] Preview incluye rama `test`
- [ ] Variables de Production configuradas
- [ ] Variables de Preview (staging) configuradas
- [ ] Dominios configurados
- [ ] DNS apuntando a Vercel
- [ ] GitHub integration activa
- [ ] Deployment protections en production
- [ ] Notificaciones configuradas
- [ ] Analytics habilitado

## 📚 Recursos

- [Vercel Environments](https://vercel.com/docs/concepts/deployments/environments)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)
- [Deployment Protection](https://vercel.com/docs/security/deployment-protection)

---

## 🎓 Ejemplo Completo

```bash
# ════════════════════════════════════════════════════════════════
# CONFIGURACIÓN INICIAL (una sola vez)
# ════════════════════════════════════════════════════════════════

# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link proyecto
cd services/orders
vercel link

# 4. Configurar variables (Production)
vercel env add REDIS_TOKEN production
vercel env add QSTASH_TOKEN production
vercel env add PRISMA_DATABASE_URL production

# 5. Configurar variables (Staging/Preview)
vercel env add REDIS_TOKEN preview
vercel env add QSTASH_TOKEN preview
vercel env add PRISMA_DATABASE_URL preview

# ════════════════════════════════════════════════════════════════
# USO DIARIO (automático con Git)
# ════════════════════════════════════════════════════════════════

# Push a test → Deploy automático a staging
git push origin test

# Push a main → Deploy automático a production
git push origin main

# Ver deployment
vercel ls

# Ver logs
vercel logs <url> --follow
```

**¡Listo!** Ahora tienes Production y Staging completamente configurados. 🚀
