# New Package Setup Workflow

This guide explains how to create a new package in the Synstack monorepo.

## 1. Create Package Structure

```bash
# Navigate to packages directory
cd packages

# Create new package directory
mkdir <package-name>
cd <package-name>

# Create standard directory structure
mkdir -p src
```

## 2. Initialize Package Configuration

### Create Initial `package.json`

Create a minimal `package.json` file:

```json
{
  "name": "@synstack/<package-name>",
  "version": "0.0.0",
  "description": "Description of your package",
  "keywords": ["synstack", "your-keywords-here"]
}
```

### Run Package Sync

From the root directory, run the package sync script to automatically configure the package.json with standard settings:

```bash
pnpm package:sync
```

This script will:
- Set up the correct module type and exports
- Configure standard scripts (build, test, etc.)
- Add necessary devDependencies
- Set up repository information
- Configure publishing settings
- Ensure consistent formatting across all packages

### Create `tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Create `tsup.config.ts`

```typescript
export { default } from "../../tsup.config.base.ts";
```

## 3. Create Source Files

### Create `src/<package-name>.index.ts` (package entry point)

```typescript
// Re-export all public APIs
export * from "./<package-name>.lib.js";
export * from "./<package-name>.schema.js";
```

### Create `src/<package-name>.lib.ts` (main implementation)

```typescript
import { PipeableClass } from "@synstack/enhance";
import type { <PackageName>Schema } from "./<package-name>.schema.js";

/**
 * Main class for <package-name> functionality
 */
export class <PackageName> extends PipeableClass<<PackageName>> {
  // Implementation
}
```

### Create `src/<package-name>.schema.ts` (Zod schemas)

```typescript
import { z } from "zod";

export const <PackageName>Schema = z.object({
  // Define your schema
});

export type <PackageName>Schema = z.infer<typeof <PackageName>Schema>;
```

### Create `src/<package-name>.test.ts` (tests)

```typescript
import { describe, it } from "node:test";
import { expect } from "@synstack/expect";
import { <PackageName> } from "./<package-name>.lib.js";

describe("<PackageName>", () => {
  it("should work", () => {
    // Test implementation
    expect(true).toBe(true);
  });
});
```

## 4. Add Internal Dependencies

If your package depends on other Synstack packages:

```bash
# Add dependency using workspace protocol
pnpm add @synstack/enhance@workspace:^
pnpm add @synstack/pipe@workspace:^
# etc.
```

## 5. Update Root Configuration

### Add to `pnpm-workspace.yaml`
The new package will be automatically included via the `packages/*` glob pattern.

### Sync Package Configurations
After creating the package, run from the root:

```bash
pnpm package:sync
```

This ensures all packages have consistent configurations.

## 6. Build and Test

```bash
# From package directory
pnpm build
pnpm test

# Or from root to build all packages
pnpm build
```

## 7. Common Patterns

### Extending PipeableClass
For chainable APIs:

```typescript
import { PipeableClass } from "@synstack/enhance";

export class MyClass extends PipeableClass<MyClass> {
  constructor(private readonly data: string) {
    super();
  }

  transform(fn: (data: string) => string): MyClass {
    return new MyClass(fn(this.data));
  }
}
```

### Using Template Literal Functions
For creating typed message components:

```typescript
import { createTemplateFunction } from "@synstack/llm";

export const myTemplate = createTemplateFunction<"myType">("myType");

// Usage
const component = myTemplate`Content here`;
```

### File Naming Conventions
- `<package>.index.ts` - Package entry point (re-exports)
- `<package>.lib.ts` - Core implementation
- `<package>.schema.ts` - Zod schemas
- `<package>.test.ts` - Unit tests
- `<feature>.lib.ts` - Additional features
- `*.bundle.ts` - Grouped re-exports

## 8. Publishing Checklist

Before publishing:
1. Update version in `package.json`
2. Add changelog entry if applicable
3. Run `pnpm test` to ensure all tests pass
4. Run `pnpm build` to create distribution files
5. Use `pnpm publish-all` from root to publish all packages

## Notes

- All packages use ESM as primary format with CJS compatibility
- Packages are pre-built before publishing (no install-time builds)
- Use `import type` for type-only imports
- Follow immutable patterns - methods return new instances
- Integrate Zod schemas for runtime validation
- Extend PipeableClass for chainable APIs