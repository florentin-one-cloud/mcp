# 🚀 Deployment Guide

This guide covers deploying WeMake MCP servers to NPM and Cloudflare Workers.

## Table of Contents

- [NPM Publishing](#npm-publishing)
- [Cloudflare Workers Deployment](#cloudflare-workers-deployment)
- [Environment Configuration](#environment-configuration)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

## NPM Publishing

### Overview

All MCP servers in this monorepo are published as individual packages to NPM under the `@wemake.cx` scope. Publishing is
automated via GitHub Actions and triggered by version tags.

### Publishing Process

#### 1. Update Package Version

Update the `version` field in the server's `package.json`:

```bash
cd src/metacognitive-monitoring
# Edit package.json and bump version (e.g., 0.4.6 -> 0.4.7)
```

#### 2. Commit Changes

```bash
git add src/metacognitive-monitoring/package.json
git commit -m "chore: bump metacognitive-monitoring to v0.4.7"
```

#### 3. Create and Push Version Tag

```bash
# Create an annotated tag
git tag -a v0.4.7 -m "Release v0.4.7"

# Push the tag to trigger CI/CD
git push origin v0.4.7
```

#### 4. Monitor GitHub Actions

The `.github/workflows/publish-npm.yml` workflow will:

1. Checkout code
2. Setup Bun environment
3. Install dependencies
4. Run all tests
5. Build all packages
6. Publish packages to NPM

Track progress at: `https://github.com/florentin-one/mcp/mcp/actions`

### NPM Authentication

The GitHub Actions workflow requires an `NPM_TOKEN` secret:

#### Generating NPM Token

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Navigate to **Access Tokens**: <https://www.npmjs.com/settings/[username]/tokens>
3. Click **Generate New Token** → **Automation**
4. Copy the generated token

#### Adding Token to GitHub

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: Paste your NPM token
5. Click **Add secret**

### Version Tag Guidelines

- **Format**: `vX.Y.Z` (e.g., `v0.4.7`, `v1.0.0`)
- **Semantic Versioning**:
  - **Major** (X): Breaking changes
  - **Minor** (Y): New features (backward compatible)
  - **Patch** (Z): Bug fixes

### Publishing Multiple Packages

To publish all packages with the same version:

```bash
# Update all package.json files to the same version
# Then create and push a single tag
git tag v0.5.0
git push origin v0.5.0
```

All packages will be published with their respective versions defined in their `package.json` files.

### Manual Publishing (Local)

For testing or emergency situations:

```bash
# Login to NPM
npm login

# Navigate to server directory
cd src/metacognitive-monitoring

# Build the package
bun run build

# Publish
npm publish --access public
```

## Cloudflare Workers Deployment

### Overview

Each MCP server is deployed as a Cloudflare Worker, providing:

- **Global Distribution**: Edge deployment across 300+ cities
- **Low Latency**: Sub-50ms response times worldwide
- **HTTP Access**: Standard HTTP endpoints for web clients
- **Auto-scaling**: Automatic scaling based on demand

### Deployment Process

#### Automatic Deployment

Deployments are triggered automatically when:

1. **Push to `main` branch** with changes to:
   - `src/**` (any server source files)
   - `package.json`
   - `bun.lock`

2. **Manual workflow dispatch** via GitHub Actions

The `.github/workflows/deploy-workers.yml` workflow deploys all 7 servers in parallel.

#### Manual Deployment (Local)

```bash
# Navigate to server directory
cd src/metacognitive-monitoring

# Build the worker
bun run build

# Deploy to Cloudflare
bunx wrangler deploy dist/worker.js

# Or deploy all servers
cd ../..
for server in src/*/; do
  cd "$server"
  bun run build
  bunx wrangler deploy dist/worker.js
  cd ../..
done
```

### Worker Configuration

Each server has a `wrangler.toml` configuration file:

```toml
name = "mcp-metacognitive-monitoring"
main = "dist/worker.js"
compatibility_date = "2024-01-01"
nodejs_compat = true
```

**Configuration Options**:

- `name`: Worker name (appears in Cloudflare dashboard)
- `main`: Entry point (built worker file)
- `compatibility_date`: Cloudflare runtime compatibility
- `nodejs_compat`: Enable Node.js compatibility

### Worker Endpoints

After deployment, workers are accessible at:

```
https://mcp-{server-name}.{account}.workers.dev
```

Example:

```
https://mcp-metacognitive-monitoring.wemake.workers.dev
```

### Testing Workers Locally

Use Wrangler's development server:

```bash
cd src/metacognitive-monitoring
bun run build
bunx wrangler dev dist/worker.js
```

Access at `http://localhost:8787`

**Testing with MCP clients**:

Workers expose MCP protocol over HTTP. Configure your MCP client to use the HTTP endpoint instead of stdio.

## Environment Configuration

### Required Secrets

#### For NPM Publishing

| Secret      | Description          | How to Obtain                                      |
| ----------- | -------------------- | -------------------------------------------------- |
| `NPM_TOKEN` | NPM automation token | <https://www.npmjs.com/settings/[username]/tokens> |

#### For Cloudflare Workers

| Secret                  | Description                        | How to Obtain                                    |
| ----------------------- | ---------------------------------- | ------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`  | API token with Workers permissions | <https://dash.cloudflare.com/profile/api-tokens> |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID         | Visible in Cloudflare dashboard sidebar          |

### Setting Up Cloudflare Secrets

#### 1. Create API Token

1. Go to <https://dash.cloudflare.com/profile/api-tokens>
2. Click **Create Token**
3. Use **Edit Cloudflare Workers** template, or create custom token with:
   - Permission: `Account.Workers Scripts` → `Edit`
4. Copy the generated token

#### 2. Get Account ID

1. Log in to <https://dash.cloudflare.com>
2. Select any domain
3. Account ID is visible in the right sidebar under **Account ID**
4. Copy the ID

#### 3. Add Secrets to GitHub

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add both secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

### Local Development Environment

Create a `.env` file in the project root (not committed):

```bash
# NPM
NPM_TOKEN=your_npm_token_here

# Cloudflare
CLOUDFLARE_API_TOKEN=your_cloudflare_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
```

## CI/CD Pipeline

### NPM Publishing Pipeline

**File**: `.github/workflows/publish-npm.yml`

**Trigger**: Version tags (`v*.*.*`)

**Steps**:

1. Checkout code
2. Setup Bun (v1.3.0)
3. Install dependencies
4. Run tests (`bun test`)
5. Build all packages (`bun run build-all`)
6. Publish to NPM (`bun run publish-packages`)

**Permissions**:

- `contents: read`
- `packages: write`

### Cloudflare Workers Pipeline

**File**: `.github/workflows/deploy-workers.yml`

**Triggers**:

- Push to `main` (when `src/**`, `package.json`, or `bun.lock` changes)
- Manual workflow dispatch

**Strategy**:

- **Matrix deployment**: All 7 servers deploy in parallel
- **Fail-fast disabled**: One failure doesn't stop others

**Steps** (per server):

1. Checkout code
2. Setup Bun (v1.3.0)
3. Install dependencies
4. Build all packages
5. Deploy to Cloudflare Workers using `wrangler`

**Permissions**:

- `contents: read`
- `deployments: write`

### Monitoring Deployments

#### Via GitHub Actions

1. Go to repository **Actions** tab
2. View workflow runs
3. Check logs for errors or success messages

#### Via Cloudflare Dashboard

1. Go to <https://dash.cloudflare.com>
2. Navigate to **Workers & Pages**
3. View deployed workers and their status

#### Via CLI

```bash
# List deployed workers
bunx wrangler deployments list

# View worker logs
bunx wrangler tail mcp-metacognitive-monitoring
```

## Troubleshooting

### NPM Publishing Issues

#### Authentication Failed

**Symptom**: `npm ERR! 401 Unauthorized`

**Solutions**:

1. Verify `NPM_TOKEN` is correctly set in GitHub secrets
2. Ensure token has **Automation** type (not Read-only)
3. Check token hasn't expired
4. Regenerate token if necessary

#### Package Already Published

**Symptom**: `npm ERR! 403 Forbidden - You cannot publish over the previously published versions`

**Solutions**:

1. Bump version in `package.json`
2. Create new version tag
3. Don't reuse version numbers

#### Scope Permission Denied

**Symptom**: `npm ERR! 403 Forbidden - you must verify your email to publish packages under the @wemake.cx scope`

**Solutions**:

1. Verify NPM account email
2. Ensure you're a member of the `@wemake.cx` NPM organization
3. Contact organization admin for permissions

### Cloudflare Workers Deployment Issues

#### Invalid API Token

**Symptom**: `Authentication error [code: 10000]`

**Solutions**:

1. Verify `CLOUDFLARE_API_TOKEN` in GitHub secrets
2. Check token has correct permissions (`Account.Workers Scripts`)
3. Regenerate token if expired

#### Account ID Mismatch

**Symptom**: `Could not find account with ID`

**Solutions**:

1. Verify `CLOUDFLARE_ACCOUNT_ID` matches your actual account ID
2. Check for extra spaces or characters in the secret
3. Copy ID directly from Cloudflare dashboard

#### Worker Build Failed

**Symptom**: Build errors during deployment

**Solutions**:

1. Test build locally: `bun run build`
2. Check TypeScript errors: `bun run check`
3. Verify all dependencies are installed
4. Review error logs for specific issues

#### Worker Size Exceeded

**Symptom**: `Your worker exceeded the size limit`

**Solutions**:

1. Review dependencies in `package.json`
2. Remove unused imports
3. Consider code splitting or external dependencies
4. Cloudflare free tier: 1MB limit, paid: 10MB limit

### CORS Configuration

If accessing workers from web clients:

**Add CORS headers** to worker responses:

```typescript
// In worker.ts
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// Return with headers
return new Response(body, { headers });
```

### Common Build Errors

#### TypeScript Errors

**Symptom**: `error TS2304: Cannot find name...`

**Solutions**:

1. Run `bun install` to ensure all types are installed
2. Check `tsconfig.json` configuration
3. Verify `@types/*` packages are in `devDependencies`

#### Missing Dependencies

**Symptom**: `Cannot find module...`

**Solutions**:

1. Install missing dependency: `bun add <package>`
2. Check `package.json` includes all imports
3. Run `bun install` after pulling changes

#### Build Target Issues

**Symptom**: `Unsupported feature for target...`

**Solutions**:

1. Check build script targets: `--target='browser'` for workers
2. Update `compatibility_date` in `wrangler.toml`
3. Avoid Node.js-specific APIs in worker code

### Getting Help

- **GitHub Issues**: <https://github.com/florentin-one/mcp/mcp/issues>
- **Cloudflare Docs**: <https://developers.cloudflare.com/workers/>
- **NPM Support**: <https://www.npmjs.com/support>
- **MCP Specification**: <https://modelcontextprotocol.io/>

### Debug Checklist

Before reporting issues:

- [ ] Verify all secrets are correctly configured
- [ ] Test build locally (`bun run build-all`)
- [ ] Run tests locally (`bun test`)
- [ ] Check GitHub Actions logs
- [ ] Review Cloudflare Workers dashboard
- [ ] Ensure tokens haven't expired
- [ ] Verify account permissions
- [ ] Check for typos in configuration files
