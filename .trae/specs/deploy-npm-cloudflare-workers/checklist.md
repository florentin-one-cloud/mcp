# Deployment Checklist

## NPM Publishing
- [ ] All package.json files contain correct NPM metadata (name, version, description, license, repository, homepage)
- [ ] All packages have proper `exports` field pointing to built artifacts
- [ ] All packages have `files` field that includes only necessary distribution files
- [ ] All packages have `publishConfig` with appropriate access level
- [ ] .npmignore files exclude test files, source maps, and development artifacts
- [ ] Root package.json includes publish scripts that work across workspaces
- [ ] Local build generates correct dist/ output for all packages
- [ ] Test installation of built packages works in isolated environment

## GitHub Actions NPM Workflow
- [ ] .github/workflows/publish-npm.yml file exists and is valid
- [ ] Workflow triggers on version tags (e.g., v0.5.0, v1.0.0)
- [ ] Workflow runs tests before publishing
- [ ] Workflow builds all packages successfully
- [ ] Workflow detects changed packages and publishes only those
- [ ] NPM_TOKEN secret is configured in GitHub repository settings
- [ ] Workflow completes successfully on test tag push

## Cloudflare Workers Configuration
- [ ] wrangler CLI is installed as devDependency
- [ ] Each MCP server has a wrangler.toml configuration file
- [ ] wrangler.toml specifies correct name, main entry point, and compatibility date
- [ ] Build scripts generate Workers-compatible output (ESM format)
- [ ] Workers entry points expose HTTP fetch handlers

## Workers Runtime Compatibility
- [ ] HTTP-to-MCP adapter converts HTTP requests to MCP stdio format
- [ ] All servers work in local wrangler dev mode
- [ ] No Node.js-specific APIs (process, fs, child_process) are used
- [ ] Environment variables are accessed via Workers env binding
- [ ] All MCP tools function correctly in Workers runtime
- [ ] Error handling works correctly in serverless environment

## GitHub Actions Workers Deployment Workflow
- [ ] .github/workflows/deploy-workers.yml file exists and is valid
- [ ] Workflow triggers on push to main branch
- [ ] Workflow triggers on manual workflow_dispatch
- [ ] Workflow publishes each server using wrangler publish
- [ ] CLOUDFLARE_API_TOKEN secret is configured in GitHub repository
- [ ] CLOUDFLARE_ACCOUNT_ID secret is configured in GitHub repository
- [ ] Deployment completes successfully without errors
- [ ] Workers endpoints are accessible after deployment

## Documentation
- [ ] Root README.md includes NPM installation instructions with examples
- [ ] Root README.md includes Cloudflare Workers deployment guide
- [ ] Environment variable configuration is documented
- [ ] Troubleshooting section covers common NPM and Workers issues
- [ ] Each server's README includes deployment-specific usage notes
- [ ] Examples show both local and Workers usage patterns

## Testing and Validation
- [ ] NPM package installs correctly with `npm install @wemake.cx/<package>`
- [ ] Installed package can be imported and used in Node.js project
- [ ] Workers deployment succeeds to staging environment
- [ ] Workers endpoint responds to MCP requests correctly
- [ ] MCP protocol compatibility verified in both Node.js and Workers runtimes
- [ ] Load testing shows acceptable performance on Workers
- [ ] End-to-end CI/CD pipeline completes successfully (tag → NPM publish → Workers deploy)
