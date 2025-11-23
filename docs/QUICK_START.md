# 🚀 Quick Start - Git Workflow & CI/CD

## Respuestas Directas a tus Preguntas

### 1️⃣ ¿Cómo manejar dev → test → main?

**Respuesta corta:**
```
feature → dev → test → main
(daily)  (sprint) (prod)
```

**Respuesta detallada:**

- **dev**: Integración diaria, todos los developers hacen PR aquí
- **test**: Deploy a staging cada sprint, QA valida
- **main**: Deploy a producción después de QA approval

### 2️⃣ ¿Cuándo y dónde ejecutar el pipeline?

**Respuesta corta:**
```
Pipeline se ejecuta AUTOMÁTICAMENTE en CADA PR
```

**Respuesta detallada:**

| PR | Pipeline Ejecuta | Resultado |
|----|------------------|-----------|
| feature → dev | Lint + Tests + Build | Valida código |
| dev → test | Lo anterior + Deploy Staging | QA puede probar |
| test → main | Lo anterior + Security + Deploy Prod | A producción |

---

## 🎯 Comandos Esenciales

### Para Desarrollo Diario:

```bash
# 1. Crear feature
git checkout dev && git pull
git checkout -b feature/mi-feature

# 2. Desarrollar y testear
npm run lint
npm run test:coverage  # Debe pasar 70%
npm run build

# 3. Crear PR
git push origin feature/mi-feature
gh pr create --base dev

# 4. GitHub ejecuta pipeline automáticamente
# 5. Si pasa, merge!
```

### Para Release a Staging:

```bash
# Al final del sprint
gh pr create --base test --head dev --title "Release Sprint X"

# Pipeline automáticamente:
# - Ejecuta tests
# - Deploy a https://staging.freelunch.com
# - QA valida manualmente
# - Si OK, merge!
```

### Para Release a Producción:

```bash
# Después de validar staging
gh pr create --base main --head test --title "Production Release vX.X.X"

# Pipeline automáticamente:
# - Ejecuta tests + security
# - Deploy a https://freelunch.com
# - Crea tag de versión
# - Requiere 2 approvals
# - Si OK, merge!
```

---

## 📋 Configuración Inicial (Una sola vez)

### 1. Configurar protecciones de ramas:

```bash
cd /Users/juliocaicedo/code/llulioscesar/freelunch/services/orders
./scripts/setup-branch-protection.sh
```

### 2. Configurar secretos en GitHub:

```
Settings → Secrets → Actions → New secret:

- VERCEL_TOKEN (para deploys)
- CODECOV_TOKEN (opcional, para coverage)
```

### 3. Verificar workflow existe:

```bash
ls -la .github/workflows/ci.yml
# Debe existir el archivo
```

---

## ✅ Checklist Antes de Cada PR

```bash
# Ejecutar SIEMPRE antes de crear PR:
npm run lint           # ✅ Pasa?
npm run test:coverage  # ✅ Pasa con 70%+?
npm run build          # ✅ Compila?

# Si TODO pasa → Crear PR
gh pr create --base dev
```

---

## 🔍 Ver Status del Pipeline

### Opción 1: En GitHub Web
```
https://github.com/llulioscesar/freelunch/actions
```

### Opción 2: CLI
```bash
# Ver últimos pipelines
gh run list --limit 5

# Ver detalles
gh run view <run-id> --log

# Seguir en tiempo real
gh run watch
```

### Opción 3: En el PR
Los checks aparecen automáticamente en cada PR:

```
✅ Lint & Type Check
✅ Unit Tests & Coverage
✅ Build

All checks have passed
```

---

## 🆘 Troubleshooting

### Pipeline falla localmente pasa:

```bash
# 1. Limpiar e instalar
rm -rf node_modules package-lock.json
npm install

# 2. Usar Node 20
nvm use 20

# 3. Ejecutar tests
npm run test:coverage
```

### Tests fallan en coverage:

```bash
# Ver qué falta cubrir
npm run test:coverage

# Buscar líneas sin cubrir en el reporte
open coverage/lcov-report/index.html
```

### Deploy falla:

```bash
# 1. Verificar secretos están configurados
gh secret list

# 2. Si faltan, agregar:
gh secret set VERCEL_TOKEN

# 3. Re-run el pipeline
gh run rerun <run-id>
```

---

## 📚 Documentación Completa

- [Git Workflow Completo](./GIT_WORKFLOW.md)
- [Pipeline Flow Detallado](./PIPELINE_FLOW.md)
- [Arquitectura del Proyecto](./ARCHITECTURE.md)

---

## 🎓 Ejemplo Completo Paso a Paso

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ESCENARIO: Agregar nueva feature "Metrics"
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1️⃣ Crear feature branch
git checkout dev
git pull origin dev
git checkout -b feature/add-metrics

# 2️⃣ Desarrollar
# ... escribir código ...
# ... escribir tests ...

# 3️⃣ Verificar localmente
npm run lint           # ✅
npm run test:coverage  # ✅ 74.3%
npm run build          # ✅

# 4️⃣ Commit y push
git add .
git commit -m "feat: add metrics service with prometheus format"
git push origin feature/add-metrics

# 5️⃣ Crear PR
gh pr create --base dev --title "feat: Add Metrics Service"

# 6️⃣ GitHub Actions ejecuta automáticamente:
#    ✅ Lint (10s)
#    ✅ Tests (15s)
#    ✅ Build (20s)
#    Total: ~50s

# 7️⃣ Ver status
gh pr view --web
# O en: https://github.com/llulioscesar/freelunch/pulls

# 8️⃣ Si TODO pasa y tienes approval → Merge!

# 9️⃣ Al final del sprint, deploy a staging:
gh pr create --base test --head dev --title "Sprint 5 Release"
# Pipeline ejecuta + Deploy automático a staging

# 🔟 Después de QA approval, deploy a producción:
gh pr create --base main --head test --title "Production v1.2.0"
# Pipeline ejecuta + Deploy automático a producción
```

---

## 🎯 Resumen en 3 Puntos

1. **Pipeline se ejecuta AUTOMÁTICAMENTE** en cada PR
2. **NO necesitas ejecutar nada manualmente** en GitHub
3. **Solo asegúrate** que pase localmente antes de PR

**¡Eso es todo!** El pipeline hace el resto automáticamente.
