# NPM Package and Cloudflare Workers Deployment Spec

## Why
Currently, the MCP servers in this monorepo are built with Bun and distributed as a monorepo workspace, which limits deployment flexibility and portability. Publishing individual packages to NPM and enabling Cloudflare Workers deployment will provide:
- Wider accessibility through the NPM registry
- Scalable, serverless deployment option via Cloudflare Workers
- Better versioning and dependency management for downstream consumers
- Zero-downtime enterprise-grade hosting capability

## What Changes
- Add NPM publishing workflow to GitHub Actions for each MCP server package
- Create Cloudflare Workers configuration and deployment setup for each server
- Update build scripts to support both Node.js and Cloudflare Workers runtimes
- Add wrangler.toml configuration files for Cloudflare Workers deployment
- Update documentation with deployment instructions for both NPM and Cloudflare Workers
- Configure automated deployment pipeline that publishes to NPM and deploys to Cloudflare Workers on release

## Impact
- Affected specs: All 7 MCP servers (metacognitive-monitoring, sequential-thinking, structured-argumentation, scientific-method, collaborative-reasoning, constraint-solver, narrative-planner)
- Affected code: 
  - Root package.json (add publishing scripts)
  - Individual package.json files (verify NPM-ready configuration)
  - Build configuration (ensure compatibility with Workers runtime)
  - New wrangler.toml files for each server
  - New .github/workflows files for CI/CD

## ADDED Requirements

### Requirement: NPM Package Publishing
The system SHALL publish each MCP server as an independent NPM package under the @wemake.cx scope.

#### Scenario: Successful NPM Publication
- **WHEN** a new version tag is pushed (e.g., v0.5.0)
- **THEN** each changed package SHALL be built, tested, and published to NPM registry
- **AND** the package SHALL be accessible via `npm install @wemake.cx/<package-name>`

### Requirement: Cloudflare Workers Deployment
The system SHALL deploy each MCP server to Cloudflare Workers for serverless execution.

#### Scenario: Workers Deployment Success
- **WHEN** deployment is triggered (manually or via CI/CD)
- **THEN** each server SHALL be deployed to a dedicated Cloudflare Workers endpoint
- **AND** the endpoint SHALL respond to MCP protocol requests
- **AND** deployment SHALL complete with zero downtime

### Requirement: Dual Runtime Support
The system SHALL support both Node.js/Bun runtime (for NPM usage) and Cloudflare Workers runtime.

#### Scenario: Runtime Compatibility
- **WHEN** code is built for either target
- **THEN** all MCP functionality SHALL work correctly in both environments
- **AND** no runtime-specific errors SHALL occur

### Requirement: Automated CI/CD Pipeline
The system SHALL automate testing, building, publishing, and deployment via GitHub Actions.

#### Scenario: Continuous Deployment
- **WHEN** a commit is pushed to main branch
- **THEN** tests SHALL run for all changed packages
- **AND** on success, packages SHALL be published to NPM (if version changed)
- **AND** Workers deployment SHALL be triggered automatically

## MODIFIED Requirements
None - this is a new deployment infrastructure addition that doesn't modify existing functionality.

## REMOVED Requirements
None - existing development and local usage patterns remain unchanged.
