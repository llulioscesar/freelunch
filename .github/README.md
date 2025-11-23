# GitHub Actions Setup

## 🚀 Quick Setup Guide

### 1. Configure GitHub Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

Add the following secrets:

```bash
VERCEL_TOKEN           # Get from: https://vercel.com/account/tokens
```

**How to get VERCEL_TOKEN:**
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it "GitHub Actions"
4. Copy the token
5. Add as GitHub secret

### 2. (Optional) Configure Slack Notifications

```bash
SLACK_WEBHOOK_URL      # Get from Slack App settings
```

**How to get SLACK_WEBHOOK_URL:**
1. Go to https://api.slack.com/apps
2. Create new app or select existing
3. Enable "Incoming Webhooks"
4. Create webhook for your channel
5. Copy webhook URL
6. Add as GitHub secret

### 3. Configure Branch Protection

#### Protect `main` branch:
1. Go to **Settings → Branches**
2. Add rule for `main`:
   - ✅ Require pull request before merging
   - ✅ Require approvals: 1
   - ✅ Require status checks to pass
   - ✅ Require conversation resolution before merging
   - ✅ Include administrators

#### Protect `develop` branch:
1. Add rule for `develop`:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass

### 4. Configure Production Environment

1. Go to **Settings → Environments**
2. Click "New environment"
3. Name: `production`
4. Configure:
   - ✅ Required reviewers: Add yourself
   - ⏱️ Wait timer: 0 minutes (optional)

### 5. Vercel Projects Setup

For each service, you'll need to:

1. **Create Vercel project:**
   ```bash
   cd services/orders
   vercel
   # Follow prompts, select your team/account
   ```

2. **Link to existing project (if already created):**
   ```bash
   cd services/orders
   vercel link
   ```

3. **Get Project ID:**
   ```bash
   cat .vercel/project.json
   # Copy the "projectId" value
   ```

4. **Disable auto-deploy on Vercel:**
   - Go to Vercel Dashboard → Project → Settings
   - Git → Production Branch: Leave empty or set to `vercel-production`
   - This prevents conflicts with GitHub Actions

### 6. Configure Environment Variables in Vercel

For **each service** (orders, kitchen, etc.):

1. Go to Vercel Dashboard → Project → Settings → Environment Variables

2. Add for **Preview** scope:
   ```bash
   DATABASE_URL=postgresql://...staging...
   REDIS_URL=https://...staging...
   REDIS_TOKEN=...
   NODE_ENV=preview
   ```

3. Add for **Production** scope:
   ```bash
   DATABASE_URL=postgresql://...production...
   REDIS_URL=https://...production...
   REDIS_TOKEN=...
   NODE_ENV=production
   ```

---

## 📋 Workflows Explained

### `ci.yml` - Continuous Integration

**Triggers:** Every push, every PR

**What it does:**
1. Detects which services changed
2. Runs linting on changed services
3. Runs tests on changed services
4. Runs type checking (TypeScript build)

**Status:** Required for PR merge

### `deploy-preview.yml` - Preview Deployments

**Triggers:** PR opened/updated

**What it does:**
1. Detects which services changed
2. Deploys changed services to Vercel preview
3. Comments PR with preview URLs

**URLs:**
- `https://orders-{pr-number}-{hash}.vercel.app`
- `https://kitchen-{pr-number}-{hash}.vercel.app`

### `deploy-production.yml` - Production Deployments

**Triggers:** Manual (workflow_dispatch)

**What it does:**
1. Waits for manual approval (production environment)
2. Deploys selected services to production
3. Runs health checks
4. Sends Slack notification

**How to use:**
1. Go to **Actions → Deploy Production**
2. Click "Run workflow"
3. Select which services to deploy
4. Approve deployment
5. Monitor progress

---

## 🎯 Usage Examples

### Example 1: Deploying a Feature

```bash
# 1. Create feature branch
git checkout -b feature/add-metrics
cd services/orders

# 2. Make changes
# ... edit code ...

# 3. Commit and push
git add .
git commit -m "feat: add metrics endpoint"
git push origin feature/add-metrics

# 4. Create PR on GitHub
# → CI runs automatically
# → Preview deployment created
# → PR shows preview URLs

# 5. Merge PR to develop
# → Deploys to staging automatically

# 6. When ready for production:
# → Go to Actions → Deploy Production
# → Select "Deploy Orders Service"
# → Click "Run workflow"
# → Approve deployment
```

### Example 2: Deploying Multiple Services

```bash
# In GitHub UI:
# Actions → Deploy Production → Run workflow

# Select:
# ✅ Deploy Orders Service
# ✅ Deploy Kitchen Service
# ❌ Deploy Warehouse Service
# ❌ Deploy Market Service
# ❌ Deploy Frontend

# Click "Run workflow"
# → Waits for approval
# → Deploys both services in parallel
# → Runs health checks
# → Sends notification
```

### Example 3: Emergency Hotfix

```bash
# 1. Create hotfix branch from main
git checkout main
git pull
git checkout -b hotfix/critical-bug

# 2. Fix bug
# ... edit code ...

# 3. Push and create PR
git push origin hotfix/critical-bug
# Create PR to main

# 4. After PR approval and merge:
# → Immediately run Deploy Production workflow
# → Select affected services
# → Deploy to production
```

---

## 🔍 Monitoring Deployments

### View Workflow Runs
- **All runs:** https://github.com/{org}/{repo}/actions
- **Specific workflow:** Actions → Select workflow from left sidebar

### Check Deployment Status
- **Preview:** Check PR comments for URLs
- **Production:** Check workflow run summary

### View Vercel Deployments
- **Dashboard:** https://vercel.com/dashboard
- **Project deployments:** Dashboard → Select project → Deployments

---

## 🐛 Troubleshooting

### "Vercel deployment failed: No token provided"

**Solution:**
```bash
# Verify VERCEL_TOKEN is set in GitHub Secrets
# Settings → Secrets → Actions → VERCEL_TOKEN
```

### "Health check failed: Connection refused"

**Cause:** Service not ready yet

**Solution:**
- Increase wait time in workflow (currently 15s)
- Check Vercel logs for errors

### "Environment 'production' not found"

**Solution:**
```bash
# Create production environment
# Settings → Environments → New environment → "production"
# Add required reviewers
```

### "Path filter not detecting changes"

**Cause:** Incorrect path in filter

**Solution:**
```yaml
# Verify paths match your structure
filters: |
  orders:
    - 'services/orders/**'  # Must match actual path
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Path Filtering Action](https://github.com/dorny/paths-filter)

---

## ✅ Checklist

Before first deployment:

- [ ] Add `VERCEL_TOKEN` to GitHub Secrets
- [ ] (Optional) Add `SLACK_WEBHOOK_URL` to GitHub Secrets
- [ ] Configure branch protection for `main` and `develop`
- [ ] Create `production` environment with reviewers
- [ ] Create Vercel projects for each service
- [ ] Configure environment variables in Vercel
- [ ] Disable auto-deploy in Vercel
- [ ] Test CI workflow on feature branch
- [ ] Test preview deployment on PR
- [ ] Test production deployment (manual)
