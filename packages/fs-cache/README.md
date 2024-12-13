# @synstack/fs-cache

> File system-based caching with type-safe function memoization

This package provides a strongly-typed caching system that stores function results in the file system, with support for custom cache keys and value locking.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## What is it for?

Sometimes you need to cache expensive function results between program runs. This package makes it easy to cache function outputs to disk with type safety:

```typescript
import { fsCache } from "@synstack/fs-cache";

// Create a cache in the .cache directory
const cache = fsCache(".cache")
  .key(["expensive", "function"])
  .pretty(true);

// Cache an expensive function
const expensiveFunction = cache.fn(async (input: string) => {
  // Simulate expensive operation
  await new Promise(resolve => setTimeout(resolve, 1000));
  return `Processed: ${input}`;
});

// First call: takes 1 second
await expensiveFunction("test"); // "Processed: test"

// Second call: instant (reads from cache)
await expensiveFunction("test"); // "Processed: test"
```

## Installation

```bash
# Using npm
npm install @synstack/fs-cache

# Using yarn
yarn add @synstack/fs-cache

# Using pnpm
pnpm add @synstack/fs-cache
```

## Features

### Function Caching

Cache expensive function results with type safety:

```typescript
import { fsCache } from "@synstack/fs-cache";

const cache = fsCache(".cache");

// Cache with static key
const cachedFn = cache
  .key("myFunction")
  .fn((x: number) => x * x);

// Cache with dynamic key based on arguments
const cachedFn2 = cache
  .key([
    "myFunction",
    (arg: string) => arg.length.toString()
  ])
  .fn((arg: string) => arg.toUpperCase());
```

### Cache Control

Fine-grained control over cache behavior:

```typescript
// Pretty-print cached JSON
const cache = fsCache(".cache").pretty(true);

// Custom cache key generation
const cache2 = fsCache(".cache")
  .signatureFn((arg: string) => arg.toLowerCase())
  .key("normalized");

// Lock cached values
await cache.lock(true, ["key"]);  // Prevent updates
await cache.lock(false, ["key"]); // Allow updates

// Manual cache operations
const [status, value] = await cache.get(["key"]);
await cache.set(["key"], "value");
await cache.setDefault(["key"], "default");
```

## API Reference

### FsCache

The main class for file system caching:

#### Creation
- `fsCache(cwd)` - Create cache in working directory
- `key(keys)` - Set cache key or key generators
- `signatureFn(fn)` - Set input signature function
- `pretty(enabled)` - Enable/disable pretty JSON

#### Cache Operations
- `get(args)` - Get cached value
- `set(args, value)` - Set cache value
- `setDefault(args, value)` - Set default value
- `lock(isLocked, args)` - Lock/unlock cached value
- `fn(function)` - Create cached function wrapper

### Types

#### KeyFn
```typescript
type KeyFn<TFnArgs extends any[]> =
  | string
  | ((...args: TFnArgs) => string);
```

#### SignatureFn
```typescript
type SignatureFn<TFnArgs extends any[]> = (
  ...args: TFnArgs
) => any;
```

## TypeScript Support

This package is written in TypeScript and provides full type definitions:

- Generic type parameters for function arguments
- Type-safe function wrapping
- Strongly typed cache operations
- IntelliSense support for all methods

## License

Apache-2.0 - see LICENSE file for details.
