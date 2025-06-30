# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Building and Development

```bash
# Build all packages
pnpm build

# Watch mode for development (rebuilds on changes)
pnpm build:watch

# Build a specific package
cd packages/<package-name> && pnpm build
```

### Testing

```bash
# Run all tests (unit, lint, types)
pnpm test

# Run unit tests only
pnpm test:unit

# Run linting
pnpm test:lint

# Type checking
pnpm test:types

# Watch mode for unit tests
pnpm test:unit:watch

# Run tests for a specific package
cd packages/<package-name> && pnpm test
```

## Architecture Overview

Synstack is a TypeScript monorepo providing modular utilities for building LLM applications. The codebase follows these architectural principles:

1. **Immutable, Chainable APIs**: All packages implement fluent interfaces that return new instances.

2. **Builder Pattern**: Complex objects (completions, messages) use builder patterns. See `CompletionBuilder` in `@synstack/llm` for the primary example.

## Key Packages

- `@synstack/llm`: Core LLM operations, wraps Vercel AI SDK
- `@synstack/fs`: Immutable file system operations
- `@synstack/fs-cache`: Caching middleware for LLM calls
- `@synstack/json`, `@synstack/yaml`, `@synstack/xml`: Data format handlers
- `@synstack/enhance`: Base classes for wrapping values in Proxy objects and adding methods
- `@synstack/reforge`: IDE integration and development tools

## Important Notes

- The project uses experimental Node.js features. Ensure Node.js 20+ is installed.
- The project uses pnpm workspaces with the `workspace:^` protocol for internal dependencies.

## Rules

Always read the relevant rules before writing code.

- [Typescript](.llm/rules/typescript.rules.md)
- [Unit Tests](.llm/rules/unit-test.rules.md)
