#!/bin/bash

# Script para configurar protecciones de ramas en GitHub
# Requiere: gh CLI instalado y autenticado
# Uso: ./scripts/setup-branch-protection.sh

set -e

REPO="llulioscesar/freelunch"

echo "🔒 Configurando protecciones de ramas para $REPO"
echo ""

# Verificar que gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) no está instalado"
    echo "Instalar con: brew install gh"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo "❌ Error: No estás autenticado con GitHub CLI"
    echo "Ejecutar: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI configurado correctamente"
echo ""

# Función para configurar protección de rama
setup_branch_protection() {
    local branch=$1
    local approvals=$2
    local enforce_admins=$3

    echo "📋 Configurando protección para rama: $branch"

    # Nota: GitHub CLI no tiene comando directo para branch protection
    # Se puede usar la API directamente
    gh api \
      --method PUT \
      -H "Accept: application/vnd.github+json" \
      "/repos/$REPO/branches/$branch/protection" \
      -f required_status_checks='{"strict":true,"contexts":["Lint & Type Check","Unit Tests & Coverage","Build"]}' \
      -f enforce_admins=$enforce_admins \
      -f required_pull_request_reviews="{\"required_approving_review_count\":$approvals,\"dismiss_stale_reviews\":true}" \
      -f restrictions=null \
      2>/dev/null && echo "✅ Protección configurada para $branch" || echo "⚠️  Error configurando $branch (puede que la rama no exista aún)"

    echo ""
}

# Configurar dev (1 approval, admins no enforced)
setup_branch_protection "dev" 1 false

# Configurar test (2 approvals, admins enforced)
setup_branch_protection "test" 2 true

# Configurar main (2 approvals, admins enforced)
setup_branch_protection "main" 2 true

echo "🎉 Configuración de protecciones completada!"
echo ""
echo "📝 Próximos pasos:"
echo "1. Verificar en GitHub → Settings → Branches"
echo "2. Ajustar manualmente si es necesario"
echo "3. Configurar CODEOWNERS en .github/CODEOWNERS"
echo ""
