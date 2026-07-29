# Florentine One MCP Server Ecosystem

> **AI-First Enterprise Solutions for the German Market**

Florentine One delivers production-ready [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) servers
designed for enterprise environments, with a focus on GDPR compliance, German healthcare standards, and zero-downtime
deployment on Cloudflare Workers.

Our MCP servers enable Large Language Models to securely access enterprise data sources, business tools, and AI agents
while maintaining the highest standards of security, privacy, and regulatory compliance.

## 🧠 Available MCP Servers

Our ecosystem includes specialized MCP servers organized into key cognitive and operational categories:

### 🎯 Decision & Analysis Frameworks

- **[Constraint Solver](src/constraint-solver/)** - Mathematical and logical constraint satisfaction validation

### 🧩 Reasoning & Cognition

- **[Structured Argumentation](src/structured-argumentation/)** - Systematic dialectical reasoning with
  thesis-antithesis-synthesis progression
- **[Collaborative Reasoning](src/collaborative-reasoning/)** - Multi-persona expert collaboration simulation
- **[Sequential Thinking](src/sequential-thinking/)** - Step-by-step reasoning with logical dependency tracking
- **[Metacognitive Monitoring](src/metacognitive-monitoring/)** - Self-monitoring of knowledge boundaries and reasoning
  quality
- **[Scientific Method](src/scientific-method/)** - Systematic scientific inquiry and hypothesis testing framework

### 🎨 Content & Media Processing

- **[Narrative Planner](src/narrative-planner/)** - Three-act story structure planning with character development

Each server includes comprehensive documentation, usage examples, and enterprise-grade security features. Visit
individual server directories for detailed setup and configuration instructions.

## 📦 Installation

All MCP servers are published to NPM under the `@florentin-one` scope and can be installed individually:

```bash
# Install a specific server
npm install @florentin-one/mcp-metacognitive-monitoring
npm install @florentin-one/mcp-structured-argumentation
npm install @florentin-one/mcp-collaborative-reasoning
npm install @florentin-one/mcp-sequential-thinking
npm install @florentin-one/mcp-scientific-method
npm install @florentin-one/mcp-constraint-solver
npm install @florentin-one/mcp-narrative-planner
```

Or use with `bunx` for immediate execution without installation:

```bash
bunx @florentin-one/mcp-metacognitive-monitoring@latest
```

### MCP Client Configuration

#### Cursor

Add to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "Metacognitive Monitoring": {
      "command": "bunx",
      "args": ["@florentin-one/mcp-metacognitive-monitoring@latest"]
    }
  }
}
```

#### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "metacognitive-monitoring": {
      "command": "bunx",
      "args": ["@florentin-one/mcp-metacognitive-monitoring@latest"]
    }
  }
}
```

## 🚀 Deployment

### NPM Publishing

All packages are automatically published to NPM when version tags are pushed:

1. **Version Bump**: Update the version in `package.json` of the server you want to publish
2. **Create Tag**: Push a version tag (e.g., `v0.4.7`)

   ```bash
   git tag v0.4.7
   git push origin v0.4.7
   ```

3. **Automatic Publishing**: GitHub Actions will automatically build, test, and publish all packages to NPM

**Published Packages**:

- [@florentin-one/mcp-metacognitive-monitoring](https://www.npmjs.com/package/@florentin-one/mcp-metacognitive-monitoring)
- [@florentin-one/mcp-structured-argumentation](https://www.npmjs.com/package/@florentin-one/mcp-structured-argumentation)
- [@florentin-one/mcp-collaborative-reasoning](https://www.npmjs.com/package/@florentin-one/mcp-collaborative-reasoning)
- [@florentin-one/mcp-sequential-thinking](https://www.npmjs.com/package/@florentin-one/mcp-sequential-thinking)
- [@florentin-one/mcp-scientific-method](https://www.npmjs.com/package/@florentin-one/mcp-scientific-method)
- [@florentin-one/mcp-constraint-solver](https://www.npmjs.com/package/@florentin-one/mcp-constraint-solver)
- [@florentin-one/mcp-narrative-planner](https://www.npmjs.com/package/@florentin-one/mcp-narrative-planner)

### Cloudflare Workers Deployment

All MCP servers are deployed as HTTP endpoints on Cloudflare Workers for low-latency, global access:

- **Automatic Deployment**: Pushes to `main` branch automatically deploy all servers
- **Manual Deployment**: Trigger via GitHub Actions workflow dispatch
- **Global Distribution**: Deployed across Cloudflare's edge network for sub-50ms response times
- **HTTP Access**: Each server exposes MCP protocol over HTTP for web-based clients

**Worker Endpoints**: `https://mcp.florentin-one.de/{server-name}`

## 🔧 Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.0
- Node.js compatible environment
- Git for version control

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/florentin-one-cloud/mcp.git
cd mcp

# Install dependencies
bun install

# Build all packages
bun run build-all

# Run tests
bun test
bun run test:all

# Test a specific server locally
cd src/metacognitive-monitoring
bun run start
```

### Testing Cloudflare Workers Locally

```bash
# Navigate to a server directory
cd src/metacognitive-monitoring

# Start local Workers development server
bunx wrangler dev dist/worker.js

# Access at http://localhost:8787
```

### Project Structure

```tree
mcp/
├── src/
│   ├── metacognitive-monitoring/   # Self-monitoring and reasoning quality
│   ├── structured-argumentation/   # Dialectical reasoning framework
│   ├── collaborative-reasoning/    # Multi-persona collaboration
│   ├── sequential-thinking/        # Step-by-step reasoning
│   ├── scientific-method/          # Scientific inquiry framework
│   ├── constraint-solver/          # Constraint satisfaction validation
│   └── narrative-planner/          # Story structure planning
├── .github/workflows/              # CI/CD pipelines
└── CONTRIBUTING.md                 # Contribution guidelines

```

For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📜 License

This project is licensed under MIT. See the [LICENSE](LICENSE) file for details.
