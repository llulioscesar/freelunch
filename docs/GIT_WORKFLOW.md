# Git Workflow & CI/CD Strategy

## 📋 Estructura de Ramas

```
main (producción)
  ├── Protegida, requiere PR review
  ├── Deploy automático a producción
  └── Tag de versión en cada release

test (staging/pre-producción)
  ├── Protegida, requiere PR review
  ├── Deploy automático a staging
  └── Testing QA manual/automatizado

dev (desarrollo/integración)
  ├── Protegida, requiere PR review
  ├── Integración continua
  └── Base para nuevas features

feature/* (features individuales)
  └── Creadas desde dev
```

## 🔄 Flujo de Trabajo Completo

### Paso 1: Crear Feature Branch

```bash
# Asegurarte de estar en dev actualizado
git checkout dev
git pull origin dev

# Crear nueva feature
git checkout -b feature/orders-service

# Trabajar en tu feature
git add .
git commit -m "feat: implement order creation"
git push origin feature/orders-service
```

### Paso 2: PR a `dev` (Primera Integración)

**Cuándo:** Cuando completes una feature funcional

**Pipeline ejecutado:**
- ✅ Linting & Type Check
- ✅ Unit Tests (debe pasar 70% coverage)
- ✅ Build

**Proceso:**
```bash
# Crear PR en GitHub
gh pr create --base dev --title "feat: Orders Service Implementation"

# El pipeline se ejecuta automáticamente
# Esperar approval de 1+ reviewers
# Merge a dev
```

**Protección de rama `dev`:**
- Requiere 1 aprobación
- Requiere que pasen todos los checks
- Requiere que la rama esté actualizada con dev

### Paso 3: PR de `dev` → `test` (Deploy a Staging)

**Cuándo:** Al finalizar un sprint o conjunto de features

**Pipeline ejecutado:**
- ✅ Todo lo de dev +
- ✅ Integration tests (si aplica)
- ✅ Deploy automático a staging
- ✅ Smoke tests

**Proceso:**
```bash
# Crear PR desde dev a test
git checkout test
git pull origin test
gh pr create --base test --head dev --title "Release to Staging - Sprint 5"

# El pipeline ejecuta Y hace deploy a staging
# QA team hace testing manual en staging
# Merge después de QA approval
```

**Protección de rama `test`:**
- Requiere 2 aprobaciones (Dev Lead + QA)
- Requiere que pasen todos los checks
- Deploy automático a https://staging.freelunch.com

### Paso 4: PR de `test` → `main` (Deploy a Producción)

**Cuándo:** Después de validación completa en staging

**Pipeline ejecutado:**
- ✅ Todo lo de test +
- ✅ Security scan
- ✅ E2E tests (si aplica)
- ✅ Deploy automático a producción
- ✅ Creación de release tag

**Proceso:**
```bash
# Crear PR desde test a main
git checkout main
git pull origin main
gh pr create --base main --head test --title "Production Release v1.2.0"

# El pipeline ejecuta todos los checks
# Requiere approval de Product Owner / Tech Lead
# Merge hace deploy automático a producción
```

**Protección de rama `main`:**
- Requiere 2+ aprobaciones (Tech Lead + Product Owner)
- Requiere que pasen TODOS los checks (incluido security)
- Deploy automático a https://freelunch.com
- Crea tag automático: `v20241123-150530`

## 📊 Matriz de Ejecución del Pipeline

| Evento | Rama | Lint | Tests | Build | Deploy | Security |
|--------|------|------|-------|-------|--------|----------|
| PR → dev | feature/* | ✅ | ✅ 70% | ✅ | ❌ | ❌ |
| Push dev | dev | ✅ | ✅ 70% | ✅ | ❌ | ❌ |
| PR → test | dev | ✅ | ✅ | ✅ | ⚠️ Preview | ❌ |
| Push test | test | ✅ | ✅ | ✅ | ✅ Staging | ❌ |
| PR → main | test | ✅ | ✅ | ✅ | ❌ | ✅ |
| Push main | main | ✅ | ✅ | ✅ | ✅ Production | ✅ |

## 🚀 Comandos Útiles

### Crear Feature y PR a dev
```bash
# 1. Crear feature
git checkout dev && git pull
git checkout -b feature/add-metrics

# 2. Trabajar y commit
git add .
git commit -m "feat: add metrics service"
git push origin feature/add-metrics

# 3. Crear PR
gh pr create --base dev --title "feat: Add Metrics Service"
```

### Release a Staging (dev → test)
```bash
# 1. Asegurar que dev esté limpio
git checkout dev && git pull
npm test  # verificar localmente

# 2. Crear PR a test
gh pr create --base test --head dev --title "Release Sprint 5 to Staging"

# 3. El pipeline hace deploy automático a staging
# 4. QA valida en https://staging.freelunch.com
# 5. Si todo OK, merge el PR
```

### Release a Producción (test → main)
```bash
# 1. Verificar staging
curl https://staging.freelunch.com/health

# 2. Crear PR a main
gh pr create --base main --head test --title "Production Release v1.2.0"

# 3. Esperar aprobaciones (Tech Lead + PO)
# 4. Merge hace deploy automático a producción
# 5. Verificar producción
curl https://freelunch.com/health
```

## 🔒 Protecciones de Ramas Recomendadas

### Para `dev`:
```yaml
required_status_checks:
  strict: true
  contexts:
    - "Lint & Type Check"
    - "Unit Tests & Coverage"
    - "Build"
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
enforce_admins: false
allow_force_pushes: false
allow_deletions: false
```

### Para `test`:
```yaml
required_status_checks:
  strict: true
  contexts:
    - "Lint & Type Check"
    - "Unit Tests & Coverage"
    - "Build"
    - "Deploy to Staging"
required_pull_request_reviews:
  required_approving_review_count: 2
  dismiss_stale_reviews: true
enforce_admins: true
allow_force_pushes: false
allow_deletions: false
```

### Para `main`:
```yaml
required_status_checks:
  strict: true
  contexts:
    - "Lint & Type Check"
    - "Unit Tests & Coverage"
    - "Build"
    - "Security Scan"
required_pull_request_reviews:
  required_approving_review_count: 2
  require_code_owner_reviews: true
  dismiss_stale_reviews: true
enforce_admins: true
allow_force_pushes: false
allow_deletions: false
```

## 🎯 Mejores Prácticas

### Commits
✅ **HACER:**
- `feat: add order creation endpoint`
- `fix: resolve null pointer in order status`
- `test: add coverage for edge cases`
- `docs: update API documentation`

❌ **NO HACER:**
- `update`
- `fix bug`
- `changes`
- `WIP`

### Pull Requests
✅ **HACER:**
- Título descriptivo: `feat: Implement Orders Service with Hexagonal Architecture`
- Descripción detallada con contexto
- Screenshots/videos si hay cambios visuales
- Link a ticket/issue: `Closes #123`
- Lista de testing realizado

❌ **NO HACER:**
- PRs masivos (>500 líneas de código)
- PRs sin descripción
- PRs con tests fallando
- PRs sin actualizar con la rama base

### Testing antes del PR
```bash
# Siempre antes de crear PR:
npm run lint          # Linting
npm run test:coverage # Tests + coverage
npm run build         # Build
```

## 📝 Configurar Protecciones en GitHub

```bash
# 1. Ve a Settings → Branches
# 2. Agregar regla para 'dev':
   - Require pull request before merging
   - Require approvals: 1
   - Require status checks: ✓ Lint, ✓ Tests, ✓ Build

# 3. Agregar regla para 'test':
   - Require pull request before merging
   - Require approvals: 2
   - Require status checks: todos + Deploy

# 4. Agregar regla para 'main':
   - Require pull request before merging
   - Require approvals: 2
   - Require code owner reviews
   - Require status checks: todos + Security
```

## 🔄 Hotfix en Producción

Si hay un bug crítico en producción:

```bash
# 1. Crear hotfix desde main
git checkout main && git pull
git checkout -b hotfix/critical-order-bug

# 2. Fix el bug
git add .
git commit -m "hotfix: resolve critical order processing bug"
git push origin hotfix/critical-order-bug

# 3. PR directo a main (bypass test)
gh pr create --base main --title "HOTFIX: Critical Order Bug"

# 4. Después del merge a main, sync a test y dev
git checkout test && git pull
git merge main
git push origin test

git checkout dev && git pull
git merge test
git push origin dev
```

## 📚 Recursos

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
