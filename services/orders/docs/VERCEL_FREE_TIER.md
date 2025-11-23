# ✅ Vercel Free Tier - Staging y Production

## Respuesta Directa: ¿Se puede en la capa gratis?

**SÍ** ✅, puedes tener Staging y Production en el plan **Hobby (gratis)** de Vercel.

## 🆓 Qué Incluye el Plan Hobby (Gratis)

### ✅ Lo que SÍ puedes hacer (gratis):

| Característica | Límite Free Tier | ¿Suficiente? |
|----------------|------------------|--------------|
| **Deployments** | Ilimitados | ✅ Sí |
| **Preview Deployments** | Ilimitados | ✅ Sí |
| **Production Deployments** | Ilimitados | ✅ Sí |
| **Bandwidth** | 100 GB/mes | ✅ Sí (para desarrollo) |
| **Build Time** | 6000 min/mes | ✅ Sí (~200 builds de 30s) |
| **Serverless Functions** | 100 GB-Hrs | ✅ Sí |
| **Edge Functions** | 100,000 requests | ✅ Sí (para pruebas) |
| **Dominios Custom** | Ilimitados | ✅ Sí |
| **Team Members** | 1 (solo tú) | ⚠️ Para desarrollo solo |
| **Git Branches** | Todas | ✅ Sí |
| **Environment Variables** | Ilimitadas | ✅ Sí |

### ❌ Limitaciones del Free Tier:

| Característica | Free Tier | Pro Plan |
|----------------|-----------|----------|
| **Concurrent Builds** | 1 | 12 |
| **Build Time** | 6000 min/mes | 24000 min/mes |
| **Deployment Protection** | ❌ No | ✅ Sí (password protect) |
| **Log Retention** | 1 día | 30 días |
| **Team Collaboration** | ❌ 1 usuario | ✅ Ilimitado |
| **Priority Support** | ❌ No | ✅ Sí |
| **Analytics** | Básico | Avanzado |

## 🎯 Configuración Recomendada para Free Tier

### Opción A: Usar 1 Proyecto con 2 Branches (RECOMENDADO)

```
┌────────────────────────────────────────────────────────┐
│           1 PROYECTO VERCEL (FREE)                     │
└────────────────────────────────────────────────────────┘
            │
            ├─ main branch  → Production
            │  URL: https://freelunch.vercel.app
            │  Env: PRISMA_DATABASE_URL → Production DB
            │
            └─ test branch  → Staging
               URL: https://freelunch-git-test.vercel.app
               Env: PRISMA_DATABASE_URL → Staging DB
```

**Ventajas:**
- ✅ Totalmente gratis
- ✅ Deployments automáticos
- ✅ URLs diferentes por branch
- ✅ Variables de ambiente separadas

**Cómo se ve:**

```bash
# Production (rama main)
https://freelunch.vercel.app
https://orders.freelunch.vercel.app  # Si usas custom domain

# Staging (rama test)
https://freelunch-git-test.vercel.app
https://freelunch-git-test-llulioscesar.vercel.app

# Feature branches (cualquier otra rama)
https://freelunch-git-feature-xyz.vercel.app
```

### Opción B: 2 Proyectos Separados (Menos Recomendado)

```
Proyecto 1: freelunch-production (main branch)
Proyecto 2: freelunch-staging (test branch)
```

**Desventaja:** Más difícil de mantener sincronizado.

## 📋 Setup Paso a Paso (Free Tier)

### 1. Importar Proyecto en Vercel

```bash
# Opción 1: Web UI
1. Ve a https://vercel.com/new
2. Conecta GitHub
3. Selecciona: llulioscesar/freelunch
4. Framework Preset: Other
5. Root Directory: services/orders
6. Click "Deploy"

# Opción 2: CLI
npm i -g vercel
vercel login
cd services/orders
vercel --cwd .
```

### 2. Configurar Git Branches

En el proyecto de Vercel:

```
Settings → Git
  ├── Production Branch: main ✅
  └── Automatic Deployments: ✅ Enabled
```

### 3. Configurar Environment Variables

#### Para Production (rama main):

```
Settings → Environment Variables

Nombre                   | Valor                              | Environment
-------------------------|------------------------------------|--------------
NODE_ENV                 | production                         | Production
PRISMA_DATABASE_URL      | postgresql://...prod...            | Production
REDIS_URL                | https://prod-redis.upstash.io      | Production
REDIS_TOKEN              | [secret]                           | Production
QSTASH_TOKEN             | [secret]                           | Production
KITCHEN_SERVICE_URL      | https://kitchen.freelunch.com      | Production
LOG_LEVEL                | info                               | Production
```

#### Para Staging (rama test):

```
Settings → Environment Variables

Nombre                   | Valor                              | Environment
-------------------------|------------------------------------|--------------
NODE_ENV                 | staging                            | Preview
PRISMA_DATABASE_URL      | postgresql://...staging...         | Preview
REDIS_URL                | https://staging-redis.upstash.io   | Preview
REDIS_TOKEN              | [secret-staging]                   | Preview
QSTASH_TOKEN             | [secret-staging]                   | Preview
KITCHEN_SERVICE_URL      | https://kitchen-staging.com        | Preview
LOG_LEVEL                | debug                              | Preview
```

**IMPORTANTE:** Para que la rama `test` use las variables de Preview:
1. Variables marcadas como "Preview" aplican a TODAS las ramas que NO sean main
2. La rama `test` automáticamente usará las vars de Preview

### 4. URLs Automáticas

Vercel genera estas URLs automáticamente (gratis):

```bash
# Production (main)
https://freelunch.vercel.app
https://freelunch-llulioscesar.vercel.app

# Staging (test)
https://freelunch-git-test.vercel.app
https://freelunch-git-test-llulioscesar.vercel.app

# Feature (feature/new-feature)
https://freelunch-git-feature-new-feature.vercel.app
```

## 🔄 Flujo de Trabajo Gratis

### Desarrollo Diario:

```bash
# 1. Feature branch
git checkout -b feature/add-metrics
git push origin feature/add-metrics

# Vercel automáticamente:
✅ Crea Preview deployment
✅ URL: https://freelunch-git-feature-add-metrics.vercel.app
✅ Comenta en PR con la URL

# 2. PR a dev
# GitHub Actions ejecuta tests

# 3. Merge a test (staging)
git checkout test
git merge dev
git push origin test

# Vercel automáticamente:
✅ Deploy a https://freelunch-git-test.vercel.app
✅ Usa variables de Preview (staging)

# 4. Merge a main (production)
git checkout main
git merge test
git push origin main

# Vercel automáticamente:
✅ Deploy a https://freelunch.vercel.app
✅ Usa variables de Production
```

## 💰 Costos Externos Gratis

### Database: Vercel Postgres (Free Tier)

```
Free Tier:
- 256 MB storage
- 60 horas de compute/mes
- 256 MB RAM

Suficiente para: Desarrollo + Staging
Para Production: Considera Neon.tech (gratis 3 GB)
```

### Redis: Upstash (Free Tier)

```
Free Tier:
- 10,000 comandos/día
- 256 MB RAM
- Máx. 100 conexiones concurrentes

Puedes crear 2 databases gratis:
1. Producción
2. Staging
```

### Messaging: QStash (Free Tier)

```
Free Tier:
- 500 mensajes/día
- 100 schedules

Suficiente para: Desarrollo y pruebas
```

## 🎓 Ejemplo Completo (100% Gratis)

```bash
# ════════════════════════════════════════════════════════
# STACK COMPLETAMENTE GRATIS
# ════════════════════════════════════════════════════════

# Hosting & Serverless
✅ Vercel (Hobby Plan) - $0/mes
   - 100 GB bandwidth
   - Deployments ilimitados
   - Serverless functions

# Database
✅ Neon.tech (Free Tier) - $0/mes
   - 3 GB storage
   - PostgreSQL
   - 2 proyectos (Production + Staging)

# Cache
✅ Upstash Redis (Free Tier) - $0/mes
   - 10,000 comandos/día
   - 256 MB RAM
   - 2 databases

# Messaging
✅ Upstash QStash (Free Tier) - $0/mes
   - 500 mensajes/día
   - 100 schedules

# CI/CD
✅ GitHub Actions - $0/mes
   - 2000 minutos/mes
   - Runners Linux

# Monitoring
✅ Vercel Analytics (Basic) - $0/mes
   - Web Vitals
   - Basic metrics

# ════════════════════════════════════════════════════════
# TOTAL: $0/mes 🎉
# ════════════════════════════════════════════════════════
```

## ⚠️ Cuándo Migrar a Pro ($20/mes)

### Señales que necesitas Pro:

1. **Tráfico:**
   - Más de 100 GB/mes de bandwidth
   - Más de 100,000 edge function requests

2. **Team:**
   - Necesitas más de 1 usuario
   - Code reviews por otros developers

3. **Build Performance:**
   - Builds que tardan más de 5 minutos
   - Necesitas builds concurrentes

4. **Seguridad:**
   - Deployment Protection (password protect)
   - Log retention > 1 día

5. **Analytics:**
   - Necesitas Analytics avanzado
   - Real User Monitoring

## 🔍 Comparación Free vs Pro

| Característica | Free (Hobby) | Pro |
|----------------|--------------|-----|
| **Precio** | $0/mes | $20/mes |
| **Deployments** | ✅ Ilimitados | ✅ Ilimitados |
| **Preview Envs** | ✅ Sí | ✅ Sí |
| **Custom Domains** | ✅ Sí | ✅ Sí |
| **Env Variables** | ✅ Sí | ✅ Sí |
| **Team Size** | 1 | ✅ Ilimitado |
| **Concurrent Builds** | 1 | 12 |
| **Build Minutes** | 6000 | 24000 |
| **Bandwidth** | 100 GB | 1 TB |
| **Function Duration** | 10s | 60s |
| **Deployment Protection** | ❌ | ✅ |
| **Log Retention** | 1 día | 30 días |
| **Analytics** | Básico | ✅ Avanzado |

## 📚 Recursos para Free Tier

### Neon.tech (Database Gratis)

```bash
# Crear 2 proyectos:
1. freelunch-production
   → PostgreSQL 14
   → 3 GB storage

2. freelunch-staging
   → PostgreSQL 14
   → 3 GB storage

# En Vercel Environment Variables:
PRISMA_DATABASE_URL (Production) = neon-production-url
PRISMA_DATABASE_URL (Preview) = neon-staging-url
```

### Upstash Redis (Gratis)

```bash
# Crear 2 databases:
1. freelunch-prod
   → Regional
   → 10k cmds/día

2. freelunch-staging
   → Regional
   → 10k cmds/día

# En Vercel:
REDIS_URL (Production) = upstash-prod-url
REDIS_URL (Preview) = upstash-staging-url
```

## ✅ Checklist Setup Gratis

- [ ] Cuenta Vercel Hobby (gratis)
- [ ] Proyecto importado desde GitHub
- [ ] Production branch = main
- [ ] Environment Variables Production configuradas
- [ ] Environment Variables Preview configuradas
- [ ] Cuenta Neon.tech (gratis)
- [ ] Database Production en Neon
- [ ] Database Staging en Neon
- [ ] Cuenta Upstash (gratis)
- [ ] Redis Production en Upstash
- [ ] Redis Staging en Upstash
- [ ] GitHub Actions configurado
- [ ] Test push a test branch
- [ ] Test push a main branch
- [ ] Verificar URLs funcionan

## 🎯 Respuesta Final

### ¿Se puede Staging + Production gratis?

**SÍ** ✅

```
Vercel Free Tier INCLUYE:
✅ Múltiples branches (main + test + features)
✅ Deployments automáticos por branch
✅ URLs únicas por branch
✅ Environment Variables separadas
✅ Preview deployments ilimitados
✅ Dominios custom

TODO ES GRATIS 🎉
```

### URLs que tendrás (gratis):

```bash
# Production
https://freelunch.vercel.app

# Staging
https://freelunch-git-test.vercel.app

# Features
https://freelunch-git-feature-xyz.vercel.app
```

### Configuración (2 minutos):

```bash
# 1. Deploy proyecto
vercel --cwd services/orders

# 2. Configurar vars en dashboard
Settings → Environment Variables
  - Production vars → Production
  - Staging vars → Preview

# 3. Push code
git push origin test    # Deploy staging
git push origin main    # Deploy production
```

**¡Listo! Staging + Production 100% gratis.** 🚀

---

## 📖 Documentos Relacionados

- [Git Workflow](./GIT_WORKFLOW.md) - Flujo dev → test → main
- [Pipeline Flow](./PIPELINE_FLOW.md) - CI/CD con GitHub Actions
- [Vercel Setup](./VERCEL_SETUP.md) - Configuración completa
- [Quick Start](./QUICK_START.md) - Guía rápida
