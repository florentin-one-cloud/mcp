# Rebrand `mcp` → `kette` Spec

## Why

The repository name `mcp` is the Model Context Protocol acronym — a generic protocol identifier, not a product name. It carries zero semantic differentiation and misses the strategic positioning opportunity created by the BMFTR's July 2026 HTAD directive on "KI in Wertschöpfungsketten." The name `kette` (German for "chain") directly references the "lückenlose KI-Wertschöpfungskette" — the central concept of the directive — and positions the product as the reasoning infrastructure layer connecting KI-Entwickler, Software-Integratoren, and industrielle Endanwender.

## What Changes

- **BREAKING**: Rename NPM package from `@florentin-one/mcp` to `@florentin-one/kette`
- **BREAKING**: Rename binary command from `florentin-one-mcp` to `kette`
- **BREAKING**: Rename Cloudflare Worker from `florentin-one-mcp` to `kette`
- Rename source directory from `src/florentin-one-mcp/` to `src/kette/`
- Rename root `package.json` name field from `mcp` to `kette`
- Update all internal references across 18+ files (README, AGENTS.md, CONTRIBUTING.md, CI/CD workflows, vitest config, MCP client config, compliance rules, skill manifests, test files, templates, docs)
- Update McpServer instance name from `florentin-one-mcp` to `kette`
- Update production endpoint references from `mcp.florentin-one.de` to `kette.florentin-one.de`
- Add comprehensive HTAD-aligned documentation: foundational concepts, strategic frameworks, operational methodologies, functional use cases, guiding philosophies, formal ethical standards

## Impact

- Affected specs: None (new spec)
- Affected code: 18+ files across the entire repository
- Affected infrastructure: Cloudflare Worker deployment, NPM registry, GitHub repository

## ADDED Requirements

### Requirement: Package Identity

The system SHALL be published as `@florentin-one/kette` on NPM with binary command `kette`.

#### Scenario: Installation

- **WHEN** user runs `npm install @florentin-one/kette`
- **THEN** the package installs successfully and `npx kette` starts the MCP server

#### Scenario: Binary execution

- **WHEN** user runs `npx kette`
- **THEN** the MCP server starts via stdio transport with all 7 reasoning tools registered

### Requirement: Cloudflare Worker Identity

The deployed Cloudflare Worker SHALL be named `kette` and respond with server name `kette`.

#### Scenario: Worker initialization

- **WHEN** an MCP client sends an `initialize` request
- **THEN** the response `serverInfo.name` is `kette`

#### Scenario: Worker deployment

- **WHEN** CI/CD pipeline deploys to Cloudflare
- **THEN** the worker `kette` is deployed from `src/kette/` directory

### Requirement: Source Directory Structure

The source directory SHALL be `src/kette/` with all internal references updated.

#### Scenario: Build

- **WHEN** `pnpm run build-all` is executed
- **THEN** the build completes successfully from `src/kette/`

#### Scenario: Tests

- **WHEN** `pnpm run test:all` is executed
- **THEN** all unit, integration, and e2e tests pass with updated paths

### Requirement: Documentation Alignment with HTAD

The repository SHALL include comprehensive documentation that references and aligns with the BMFTR HTAD directive on "KI in Wertschöpfungsketten."

#### Scenario: Documentation completeness

- **WHEN** a reader reviews the repository documentation
- **THEN** they find: foundational concepts of the KI-Wertschöpfungskette, strategic frameworks for vertical AI integration, operational methodologies for the 7 reasoning tools, functional use cases across DACH regulated domains, guiding philosophies (augmentation over automation, systems over tools), and formal ethical standards aligned with EU AI Act and WeMake ethics guidelines

### Requirement: Endpoint References

All endpoint references SHALL use `kette.florentin-one.de` and `kette.beta.lstr.one`.

#### Scenario: MCP client configuration

- **WHEN** an MCP client connects via `https://kette.florentin-one.de/mcp`
- **THEN** the connection succeeds and all 7 tools are available

## MODIFIED Requirements

None — this is a new spec.

## REMOVED Requirements

None.
