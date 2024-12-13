# @synstack/enhance

> Safely enhance JavaScript objects with additional properties

This package provides a type-safe way to extend JavaScript objects with additional methods while maintaining access to the original object.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## What is it for?

Sometimes you need to add functionality to existing objects without modifying their prototype or risking property collisions. This package provides a safe way to enhance objects with new methods while maintaining type safety:

```typescript
import { enhance } from "@synstack/enhance";

// Create an extension with new methods
const stringExtensions = {
  reverse: () => this.split("").reverse().join(""),
  capitalize: () => this.charAt(0).toUpperCase() + this.slice(1)
};

// Enhance a string with new methods
const enhanced = enhance("string", "hello world", stringExtensions);

// Use the enhanced object
console.log(enhanced.capitalize()); // "Hello world"
console.log(enhanced.reverse());    // "dlrow olleh"

// Access the original object
console.log(enhanced.$());          // "hello world"
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
const mathExtensions = {
  square: function() { return this * this },
  double: function() { return this * 2 }
};

// Enhance a number
const num = enhance("math", 5, mathExtensions);

console.log(num.square()); // 25
console.log(num.double()); // 10
console.log(num.$());      // 5
```

#### enhanceFactory()

Create reusable enhancers with `enhanceFactory()`:

```typescript
import { enhanceFactory } from "@synstack/enhance";

// Create a reusable enhancer
const enhanceWithMath = enhanceFactory("math", {
  square: function() { return this * this },
  double: function() { return this * 2 }
});

// Enhance multiple numbers
const num1 = enhanceWithMath(5);
const num2 = enhanceWithMath(10);

console.log(num1.square()); // 25
console.log(num2.double()); // 20
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
