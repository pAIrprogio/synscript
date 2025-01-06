# @synstack/glob

> Type-safe glob pattern matching and file filtering utilities

This package provides a strongly-typed interface for working with glob patterns, including file matching, filtering, and pattern capturing capabilities.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## What is it for?

When you need to find files using glob patterns or filter paths based on patterns, this package provides type-safe utilities:

```typescript
import { glob, matches } from "@synstack/glob";

// Find all TypeScript files
const files = await glob.cwd("./src").find("**/*.ts");
console.log(files);
// ["src/index.ts", "src/utils.ts"]

// Check if a file matches a pattern
const isMatch = matches("src/file.ts", "**/*.ts");
console.log(isMatch); // true

// Exclude test files
const nonTestFiles = await glob.cwd().find(["**/*.ts", "!**/*.test.ts"]);
```

## Installation

```bash
# Using npm
npm install @synstack/glob

# Using yarn
yarn add @synstack/glob

# Using pnpm
pnpm add @synstack/glob
```

## Features

### File Finding

Find files using glob patterns with support for exclusions:

```typescript
import { glob } from "@synstack/glob";

// Find all files in a directory
const allFiles = await glob.cwd("./src").find("**/*");

// Find with multiple patterns
const tsFiles = await glob.cwd().find([
  "**/*.ts", // Include TypeScript files
  "!**/*.test.ts", // Exclude test files
  "!**/node_modules/**", // Exclude node_modules
]);

// Synchronous finding
const configFiles = glob.cwd().findSync("**/*.config.ts");
```

### Pattern Matching

Check if paths match glob patterns:

```typescript
import { matches, filterFactory } from "@synstack/glob";

// Simple matching
matches("src/file.ts", "**/*.ts"); // true
matches("test/file.ts", "!test/**"); // false

// Create reusable filters
const filter = filterFactory([
  "**/*.ts", // Include TypeScript
  "!**/*.test.ts", // Exclude tests
]);

filter("src/utils.ts"); // true
filter("src/test.test.ts"); // false
```

### Pattern Capturing

Extract values from glob patterns:

```typescript
import { capture } from "@synstack/glob";

// Capture values from paths
const values = capture("**/(*)/(*).ts", "src/utils/format.ts");
console.log(values); // ["utils", "format"]
```
