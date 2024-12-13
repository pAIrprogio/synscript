# @synstack/enhance

> Type-safe object enhancement with proxy-based method extension

This package provides a type-safe way to extend JavaScript objects with additional methods while maintaining access to the original object through proxies.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## What is it for?

Sometimes you need to add functionality to existing objects without modifying their prototype or risking property collisions. This package provides a safe way to enhance objects with new methods while maintaining type safety:

```typescript
import { enhance } from "@synstack/enhance";

// Create an extension with new methods
const objExtensions = {
  stringify: function() { return JSON.stringify(this) },
  clone: function() { return { ...this } }
};

// Enhance an object with new methods
const obj = { name: "example", value: 42 };
const enhanced = enhance("object", obj, objExtensions);

// Use the enhanced object
console.log(enhanced.stringify()); // '{"name":"example","value":42}'
console.log(enhanced.clone());     // { name: "example", value: 42 }

// Access the original object
console.log(enhanced.$());         // { name: "example", value: 42 }
```

## Installation

```bash
# Using npm
npm install @synstack/enhance

# Using yarn
yarn add @synstack/enhance

# Using pnpm
pnpm add @synstack/enhance
```

## Features

### Object Enhancement

The package provides two main functions for enhancing objects:

#### enhance()

The `enhance()` function combines an object with extension methods:

```typescript
import { enhance } from "@synstack/enhance";

// Define extension methods
const loggerExtensions = {
  log: function() { console.log(JSON.stringify(this)) },
  getTimestamp: function() { return { ...this, timestamp: Date.now() } }
};

// Enhance an object
const data = { id: 1, message: "Hello" };
const enhanced = enhance("logger", data, loggerExtensions);

// Use enhanced methods
enhanced.log();                // Logs: {"id":1,"message":"Hello"}
const timestamped = enhanced.getTimestamp(); // { id: 1, message: "Hello", timestamp: 1234567890 }
```

#### enhanceFactory()

Create reusable enhancers with `enhanceFactory()`:

```typescript
import { enhanceFactory } from "@synstack/enhance";

// Create a reusable enhancer
const withLogging = enhanceFactory("logger", {
  log: function() { console.log(JSON.stringify(this)) },
  getTimestamp: function() { return { ...this, timestamp: Date.now() } }
});

// Enhance multiple objects
const obj1 = withLogging({ id: 1, name: "First" });
const obj2 = withLogging({ id: 2, name: "Second" });

obj1.log(); // Logs: {"id":1,"name":"First"}
obj2.log(); // Logs: {"id":2,"name":"Second"}
```

## API Reference

### enhance()

```typescript
function enhance<TName, TBaseObject, TExtension>(
  name: TName,
  obj: TBaseObject,
  extendObj: TExtension
): Enhanced<TName, TBaseObject, TExtension>
```

- `name`: Unique identifier for this enhancement
- `obj`: The base object to enhance
- `extendObj`: Object containing extension methods
- Returns: A proxy that combines the base object with extension methods

### enhanceFactory()

```typescript
function enhanceFactory<TName, TExtension>(
  name: TName,
  extendObj: TExtension
): <TBaseObject>(obj: TBaseObject) => Enhanced<TName, TBaseObject, TExtension>
```

- `name`: Unique identifier for this enhancement factory
- `extendObj`: Object containing extension methods
- Returns: A function that enhances objects with the provided extensions

### Enhanced Type

```typescript
type Enhanced<TName, TBaseObject, TExtension> = {
  $: TBaseObject;
  [ENHANCER_NAME]: TName;
} & TExtension & TBaseObject
```

A type representing an enhanced object that combines:
- Original object properties (`TBaseObject`)
- Extension methods (`TExtension`)
- Special `$` property to access the original object
- Symbol property to identify the enhancer

## TypeScript Support

This package is written in TypeScript and provides full type definitions:

- Generic type parameters for base objects and extensions
- Type-safe access to both original and enhanced methods
- Proper typing for extension method context (`this`)
- IntelliSense support for all enhanced properties

## License

Apache-2.0 - see LICENSE file for details.
