# @synstack/pipe

Type-safe chainable operations with immutable transformations

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

> [!NOTE]
> This package provides the foundation for creating chainable, immutable operations in TypeScript. It's used by other @synstack packages to implement type-safe method chaining.

## What is it for?

Create type-safe chainable operations that maintain immutability. Each operation returns a new instance, allowing for safe method chaining:

```typescript
import { pipe } from "@synstack/pipe";

// Each operation returns a new instance
const result = pipe("hello")
  ._((str) => str.toUpperCase()) // Returns new Pipeable
  ._((str) => str.split("")) // Returns new Pipeable
  ._((arr) => arr.reverse()).$; // Returns new Pipeable // Get final value

console.log(result); // ['O','L','L','E','H']

// Original value remains unchanged
const original = "hello";
const modified = pipe(original)._((str) => str.toUpperCase()).$;

console.log(original); // 'hello'
console.log(modified); // 'HELLO'
```

## Installation

```bash
# Using npm
npm install @synstack/pipe

# Using yarn
yarn add @synstack/pipe

# Using pnpm
pnpm add @synstack/pipe
```

## Features

### Immutable Chaining

The `pipe` function creates a `Pipeable` instance that wraps a value and provides chainable methods:

```typescript
import { pipe } from "@synstack/pipe";

// Chain multiple transformations
const result = pipe({ count: 1 })
  ._((obj) => ({ ...obj, doubled: obj.count * 2 }))
  ._((obj) => ({ ...obj, squared: obj.doubled ** 2 })).$;

console.log(result); // { count: 1, doubled: 2, squared: 4 }
```

### Type-Safe Operations

TypeScript types are preserved through the chain:

```typescript
import { pipe } from "@synstack/pipe";

interface User {
  name: string;
  age: number;
}

const user: User = { name: "John", age: 30 };

// Types are inferred correctly through the chain
const result = pipe(user)
  ._((u) => ({ ...u, email: "john@example.com" }))
  ._((u) => ({ ...u, isAdult: u.age >= 18 })).$;

// Result type is inferred as:
// { name: string; age: number; email: string; isAdult: boolean }
```
