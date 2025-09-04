# @synstack/fs-cache

Human-friendly file system caching

## What is it for?

Sometimes you need to cache expensive function results between program runs. This package makes it easy to cache function outputs to disk with type safety while keeping the file system clean and cache entries readable.

```typescript
import { fsCache } from "@synstack/fs-cache";

// Create a cache in the .cache/expensive/function.json file
const cache = fsCache(".cache").key(["expensive", "function"]).pretty(true);

// Cache an expensive function
const cachedExpensiveFunction = cache.fn(expensiveFunction);
```

## Caching philosophy

The idea is to generate cache entries without poluting the file system with expired entries. This requires a two-step matching process:

- First file is matched based on the key defined with `key()`
- If the file exists, a second check is done based on input parameters and can be customized with `signatureFn()` which defaults to [`deepEqual`](#Deep-Equality)
- If it matches, the output is returned from the cache
- If it doesn't match or the file doesn't exist, the function is called, the output is cached, and then returned

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

### [@synstack/fs](../fs/README.md) interoperability

Cache directory can be initialized using an `FsDir` instance:

```typescript
import { fsDir } from "@synstack/fs";

const cacheDir = fsDir(".cache");
const cache = fsCache(cacheDir);
```

### Function Caching

Cache expensive function results with type safety:

```typescript
import { fsCache } from "@synstack/fs-cache";

const cache = fsCache(".cache");

// Cache with static key
const cachedFn = cache.key(["myFunction"]).fn((x: number) => x * x);
```

### Cache Control

Fine-grained control over cache behavior:

```typescript
// Pretty-print cached JSON
const cache = fsCache(".cache").pretty(true);

// Custom cache signature generation
const cache2 = fsCache(".cache")
  .signatureFn((arg: string) => arg.toLowerCase())
  .key(["normalized"]);

// Lock cached values
await cache.lock(true, ["key"]); // Prevent updates
await cache.lock(false, ["key"]); // Allow updates

// Manual cache operations
const [status, value] = await cache.get(["key"]);
await cache.set(["key"], "value");

// Set a default cache value if the file doesn't exist
await cache.setDefault(["key"], "default");
```

## Deep Equality

A custom deep equality function is provided.
The only custom behavior implemented, is that objects with undefined values are considered equal to objects with matching missing values.

```typescript
import { deepEqual } from "@synstack/fs-cache";

deepEqual({ a: undefined }, {}); // true
```
