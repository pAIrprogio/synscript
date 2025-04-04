# @synstack/pipe

Type-safe chainable operations with immutable transformations

> [!NOTE]
> This package provides the foundation for creating chainable, immutable operations in TypeScript. It's used by other @synstack packages to implement type-safe method chaining.

## What is it for?

Create type-safe chainable operations inspired by the functional programming concept of pipes. Each operation can transform the value while maintaining type safety through the chain:

```typescript
import { pipe } from "@synstack/pipe";

// Chain multiple transformations
const result = pipe("hello")
  ._((str) => str.toUpperCase()) // Returns new Pipeable
  ._((str) => str.split("")) // Returns new Pipeable
  ._((arr) => arr.reverse()).$; // Get final value

console.log(result); // ['O','L','L','E','H']
```

> [!NOTE]
> While the library provides the structure for chaining operations, it's up to you to ensure immutability by not modifying values within the transformations.

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

### Chainable Operations

The `pipe` function creates a `Pipeable` instance that wraps a value and provides chainable methods:

```typescript
import { pipe } from "@synstack/pipe";

// Chain multiple transformations
const result = pipe({ count: 1 })
  ._((obj) => ({ ...obj, doubled: obj.count * 2 })) // Create new object to maintain immutability
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

### Instance vs Value Operations

The library provides two ways to transform values:

```typescript
import { pipe, Pipeable } from "@synstack/pipe";

class Counter extends Pipeable<Counter, number> {
  private value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  instanceOf(): Counter {
    return this;
  }

  valueOf(): number {
    return this.value;
  }

  add(n: number): Counter {
    return new Counter(this.value + n);
  }
}

// Transform using the instance (._)
const withInstance = pipe(new Counter(1))._((counter) => counter.add(2)).$; // 3

// Transform using the value (._$)
const withValue = pipe(new Counter(1))._$((value) => value + 2).$; // 3
```

### Custom Pipeable Classes

You can create your own pipeable classes by extending the `Pipeable` class:

```typescript
import { Pipeable } from "@synstack/pipe";

class StringPipe extends Pipeable<StringPipe, string> {
  private readonly value: string;

  constructor(value: string) {
    super();
    this.value = value;
  }

  instanceOf(): StringPipe {
    return this;
  }

  valueOf(): string {
    return this.value;
  }

  append(str: string): StringPipe {
    return new StringPipe(this.value + str);
  }
}

const result = pipe(new StringPipe("Hello")).append(" ").append("World").$;

console.log(result); // "Hello World"
```
