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

### Publishing
```bash
# Publish all packages (uses Lerna)
pnpm publish-all

# Sync package configurations before publishing
pnpm package:sync
```

## Architecture Overview

Synstack is a TypeScript monorepo providing modular utilities for building LLM applications. The codebase follows these architectural principles:

1. **Immutable, Chainable APIs**: All packages implement fluent interfaces that return new instances. Classes extend `PipeableClass` to enable method chaining without mutation.

2. **Schema-First Design**: Runtime validation using Zod schemas is integrated throughout. Look for `*.schema.ts` files to understand data structures.

3. **Functional Composition**: The `@synstack/pipe` package enables functional composition patterns. Most operations can be chained using the pipe operator.

4. **Package Dependencies**: Packages form a dependency graph with `@synstack/llm` at the center, wrapping Vercel's AI SDK. File operations depend on `@synstack/fs`, which provides immutable file system operations.

5. **Builder Pattern**: Complex objects (completions, messages) use builder patterns. See `CompletionBuilder` in `@synstack/llm` for the primary example.

6. **Template Literal Functions**: Custom template tags create typed message components. Example:
   ```typescript
   const message = system`You are a helpful assistant`;
   ```

## Key Packages

- `@synstack/llm`: Core LLM operations, wraps Vercel AI SDK
- `@synstack/fs`: Immutable file system operations
- `@synstack/fs-cache`: Caching middleware for LLM calls
- `@synstack/json`, `@synstack/yaml`, `@synstack/xml`: Data format handlers
- `@synstack/enhance`: Base classes for creating pipeable APIs
- `@synstack/reforge`: VS Code integration and development tools

## Development Patterns

When implementing new features:

1. **Extend PipeableClass**: For chainable APIs, extend `PipeableClass` from `@synstack/enhance`
2. **Use Immutable Patterns**: Methods should return new instances, not mutate existing ones
3. **Add Zod Schemas**: Define schemas for all data structures in `*.schema.ts` files
4. **Follow Naming Conventions**:
   - `*.index.ts` - Package entry point
   - `*.lib.ts` - Core implementation
   - `*.test.ts` - Test files
   - `*.bundle.ts` - Re-exports

5. **Test with Snapshots**: Tests use Node.js experimental snapshot testing. Update snapshots with `--test-update-snapshots`

## Important Notes

- The project uses experimental Node.js features. Ensure Node.js 20+ is installed.
- Dual module support: Packages export both ESM and CommonJS formats.
- The `reforge` directory contains self-referential examples showing how Synstack builds itself.
- When modifying build configurations, run `pnpm package:sync` to update all packages.
- Type imports should use `import type` syntax for better tree-shaking.
- The project uses pnpm workspaces with the `workspace:^` protocol for internal dependencies.
- Packages are pre-built before publishing - no `prepare` scripts run during consumer installs.