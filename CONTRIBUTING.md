# Contributing to WeMake MCP Servers

Thank you for your interest in contributing to the WeMake MCP Server ecosystem! This guide will help you get started
with development, testing, and deployment.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Making Changes](#making-changes)
- [Publishing](#publishing)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites

- **Bun** >= 1.3.0 ([installation guide](https://bun.sh))
- **Git** for version control
- **Node.js** compatible environment
- Basic understanding of TypeScript and the Model Context Protocol

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/florentin-one/mcp/mcp.git
cd mcp

# Install dependencies
bun install

# Build all packages
bun run build-all

# Run tests to verify setup
bun test
```

### Repository Structure

```
mcp/
├── src/                              # MCP servers
│   ├── metacognitive-monitoring/     # Each server has its own directory
│   │   ├── src/                      # Source code
│   │   │   ├── index.ts             # Main entry point (stdio)
│   │   │   ├── worker.ts            # Cloudflare Worker entry point
│   │   │   └── ...                  # Server implementation
│   │   ├── dist/                     # Build output (gitignored)
│   │   ├── package.json              # Server package configuration
│   │   ├── wrangler.toml            # Cloudflare Workers config
│   │   └── README.md                # Server documentation
│   └── .../                          # Other servers
├── .github/workflows/                # CI/CD pipelines
│   ├── publish-npm.yml              # NPM publishing workflow
│   └── deploy-workers.yml           # Cloudflare deployment workflow
├── package.json                      # Monorepo configuration
├── README.md                         # Main documentation
├── DEPLOYMENT.md                     # Deployment guide
└── CONTRIBUTING.md                   # This file
```

## Development Workflow

### Working on a Server

```bash
# Navigate to the server directory
cd src/metacognitive-monitoring

# Make your changes to src/

# Build the server
bun run build

# Test locally (stdio mode)
bun run start

# Run server tests
bun test
```

### Testing Cloudflare Workers Locally

Cloudflare Workers can be tested locally using Wrangler:

```bash
# Build the worker
bun run build

# Start local development server
bunx wrangler dev dist/worker.js

# The server will be available at http://localhost:8787
# Press Ctrl+C to stop
```

**Testing the worker**:

```bash
# In another terminal, test the worker with curl
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

### Creating a New Server

1. **Copy an existing server** as a template:

   ```bash
   cp -r src/metacognitive-monitoring src/my-new-server
   ```

2. **Update `package.json`**:
   - Change `name` to `@wemake.cx/my-new-server`
   - Update `description`, `keywords`, `homepage`
   - Update `bin` entry to `mcp-server-my-new-server`

3. **Update `wrangler.toml`**:
   - Change `name` to `mcp-my-new-server`

4. **Update `README.md`** with server documentation

5. **Add to CI/CD workflows**:
   - Add server name to `.github/workflows/deploy-workers.yml` matrix

6. **Implement your server** in `src/`

## Testing

### Running Tests

```bash
# Run all tests from root
bun test

# Run tests for all servers
bun run test:all

# Run tests with coverage
bun run test:coverage
bun run test:coverage:all

# Test a specific server
cd src/metacognitive-monitoring
bun test
```

### Writing Tests

Place test files next to the code they test with `.test.ts` extension:

```typescript
// src/metacognitive-monitoring/src/core/monitor.test.ts
import { describe, it, expect } from "bun:test";
import { Monitor } from "./monitor";

describe("Monitor", () => {
  it("should assess knowledge level", () => {
    const monitor = new Monitor();
    const result = monitor.assess({
      domain: "TypeScript",
      knowledgeLevel: "proficient"
    });
    expect(result.valid).toBe(true);
  });
});
```

### Testing Checklist

Before submitting changes:

- [ ] All existing tests pass
- [ ] New functionality has test coverage
- [ ] Server builds successfully (`bun run build`)
- [ ] Server runs locally (`bun run start`)
- [ ] Worker builds and runs locally (`bunx wrangler dev dist/worker.js`)
- [ ] No TypeScript errors (`bun run check`)
- [ ] Code follows style guidelines

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feature/add-new-tool` - New features
- `fix/constraint-validation` - Bug fixes
- `docs/update-readme` - Documentation updates
- `refactor/simplify-logic` - Code refactoring

### Commit Messages

Follow conventional commit format:

```
type(scope): brief description

Detailed explanation if needed

Examples:
- feat(metacognitive): add confidence calibration
- fix(constraint-solver): handle division by zero
- docs(readme): update installation instructions
- chore(deps): upgrade MCP SDK to 1.27.0
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Publishing

### Version Bumps

Publishing to NPM is triggered by version tags. Here's how to publish:

#### 1. Update Version

Edit the `version` field in the server's `package.json`:

```bash
cd src/metacognitive-monitoring
# Edit package.json: "version": "0.4.7"
```

Follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.5.0): New features (backward compatible)
- **Patch** (0.4.7): Bug fixes

#### 2. Commit and Push

```bash
git add src/metacognitive-monitoring/package.json
git commit -m "chore: bump metacognitive-monitoring to v0.4.7"
git push origin main
```

#### 3. Create Version Tag

```bash
# Create annotated tag
git tag -a v0.4.7 -m "Release v0.4.7

- Added confidence calibration
- Fixed edge case in knowledge assessment
- Updated documentation"

# Push tag to trigger CI/CD
git push origin v0.4.7
```

#### 4. Monitor Deployment

- Check [GitHub Actions](https://github.com/florentin-one/mcp/actions) for build status
- Verify package appears on [NPM](https://www.npmjs.com/org/wemake.cx)
- Check [Cloudflare Dashboard](https://dash.cloudflare.com) for worker deployments

### Cloudflare Workers Deployment

Workers are automatically deployed when:

1. **Changes are pushed to `main` branch** affecting:
   - Any file in `src/**`
   - `package.json`
   - `bun.lock`

2. **Manual trigger** via GitHub Actions

No version tag needed for worker deployment.

## Code Standards

### TypeScript

- Use TypeScript strict mode
- Define proper types for all functions
- Avoid `any` type unless absolutely necessary
- Use interfaces for object shapes

```typescript
// Good
interface KnowledgeAssessment {
  domain: string;
  level: "expert" | "proficient" | "basic";
  confidence: number;
}

function assess(data: KnowledgeAssessment): boolean {
  return data.confidence > 0.7;
}

// Avoid
function assess(data: any) {
  return data.confidence > 0.7;
}
```

### Code Style

Code formatting is enforced by Prettier:

```bash
# Format code
bun run format

# Check for issues
bun run check
```

**Conventions**:

- Use `const` over `let` when possible
- Prefer arrow functions for callbacks
- Use async/await over promises
- Keep functions small and focused
- Add JSDoc comments for public APIs

### MCP Server Structure

Follow the Code Mode architecture:

```
src/
├── core/          # Pure business logic (no MCP dependencies)
│   ├── types.ts   # Type definitions
│   └── logic.ts   # Core functionality
├── codemode/      # Programmable TypeScript API
│   └── api.ts     # Public API exports
├── mcp/           # MCP protocol adapter
│   └── server.ts  # MCP server implementation
├── index.ts       # Entry point for stdio
└── worker.ts      # Entry point for Cloudflare Workers
```

**Benefits**:

- Testable business logic independent of MCP
- Reusable code across different deployment modes
- Clear separation of concerns

## Pull Request Process

### Before Submitting

1. **Test thoroughly**:

   ```bash
   bun run build-all
   bun run test:all
   bun run check
   ```

2. **Update documentation** if needed:
   - Server README.md
   - Root README.md (if adding new server)
   - DEPLOYMENT.md (if changing deployment process)

3. **Check code quality**:
   - No console.log statements (use proper logging)
   - No commented-out code
   - No debugging code

### Submitting PR

1. **Push your branch**:

   ```bash
   git push origin feature/my-feature
   ```

2. **Create PR** on GitHub with:
   - Clear title describing the change
   - Description of what changed and why
   - Link to any related issues
   - Screenshots/examples if applicable

3. **PR Template**:

   ```markdown
   ## Description

   Brief description of changes

   ## Changes Made

   - Added feature X
   - Fixed bug Y
   - Updated documentation Z

   ## Testing

   - [ ] All tests pass
   - [ ] New tests added for new functionality
   - [ ] Tested locally (stdio mode)
   - [ ] Tested worker mode (if applicable)

   ## Checklist

   - [ ] Code follows style guidelines
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented if necessary)
   ```

### Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, maintainers will merge

### After Merge

- Delete your feature branch
- Changes will automatically deploy to workers
- For NPM publish, follow [version bump process](#version-bumps)

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/florentin-one/mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/florentin-one/mcp/discussions)
- **Documentation**: [MCP Specification](https://modelcontextprotocol.io/)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help newcomers learn and grow

Thank you for contributing to WeMake MCP Servers! 🚀
