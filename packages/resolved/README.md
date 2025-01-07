# @synstack/resolved

Type-safe piping of synchronous or asynchronous values while preserving sync state

> [!WARNING]
> This package is included in the [@synstack/synscript](../synscript/README.md) package. It is not recommended to install both packages at the same time.

> [!NOTE]
> This package may be merged with the [@synstack/pipe](../pipe/README.md) package in the future.

## What is it for?

When working with functions that can return either synchronous or asynchronous values, this package helps maintain type safety and provides a clean API for handling both cases and maintaining type safety:

```typescript
import { pipe } from "@synstack/resolved";

// Sync operations remain sync
const syncResult = pipe("Hello World")._((v) => v.toUpperCase()).$;
console.log(syncResult); // "HELLO WORLD"

// Async operations return promises
const asyncResult = pipe(Promise.resolve("Hello World"))._((v) =>
  v.toUpperCase(),
).$;
console.log(await asyncResult); // "HELLO WORLD"

// Mixed operations maintain type safety
const mixedResult = pipe("Hello World")._((v) =>
  Promise.resolve(v.toUpperCase()),
).$;
console.log(await mixedResult); // "HELLO WORLD"
```

## Installation

```bash
# Using npm
npm install @synstack/resolved

# Using yarn
yarn add @synstack/resolved

# Using pnpm
pnpm add @synstack/resolved
```

## Features

### Value Piping

The `pipe` function creates a chainable interface for working with resolvable values:

```typescript
import { pipe } from "@synstack/resolved";

// Sync operations
const value = pipe("hello")
  ._((v) => v.toUpperCase())
  ._((v) => v + "!").$;

// Async operations
const asyncValue = pipe(Promise.resolve("hello"))
  ._((v) => v.toUpperCase())
  ._((v) => Promise.resolve(v + "!")).$;
```

### Array Resolution

The `resolveAll` function handles arrays of resolvable values:

```typescript
import { resolveAll } from "@synstack/resolved";

// Sync array remains sync
const syncArray = resolveAll(["a", "b", "c"]);

// Array with promises becomes a promise
const asyncArray = resolveAll([
  Promise.resolve("a"),
  "b",
  Promise.resolve("c"),
]);
```

### Type Inference

The package provides type utilities for working with resolvable values:

```typescript
import type { Resolvable } from "@synstack/resolved";

// Infer resolved type
type ResolvedValue = Resolvable.Infer<Promise<string>>; // string

// Check if value is a promise
type IsPromise = Resolvable.IsPromise<Promise<string>>; // true
type NotPromise = Resolvable.IsPromise<string>; // never

// Work with arrays
type ArrayValue = Resolvable.ArrayOf<string>; // Array<string | Promise<string>>
type ResolvedArray = Resolvable.ArrayOf.Infer<[Promise<string>, number]>; // [string, number]
```
