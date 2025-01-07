# @synstack/str

Advanced chainable string manipulation utilities

> [!WARNING]
> This package is included in the [@synstack/synscript](../synscript/README.md) package. It is not recommended to install both packages at the same time.

## What is it for?

When working with strings in TypeScript, you often need to chain multiple operations like trimming, splitting, case conversion, and indentation management. This package provides a fluent, chainable API for string manipulation with full type safety:

```typescript
import { str } from "@synstack/str";

// Basic chaining
const result = str("  Hello World  ").trim().split(" ").at(0).$;

// Case conversion
const camelCase = str("hello-world").camelCase().$;
console.log(camelCase); // 'helloWorld'

// Advanced manipulation
const formatted = str("    some\n  indented\n      text")
  .trimEmptyLines()
  .dedent().$;

// Line manipulation
const lines = str("line1\n\n\n\nline2").chopRepeatNewlines(1).split("\n");
console.log(lines); // ['line1', 'line2']
```

## Installation

```bash
npm install @synstack/str
# or
yarn add @synstack/str
# or
pnpm add @synstack/str
```

## Features

### Chainable Operations

All string operations are chainable and maintain type safety:

```typescript
const result = str("  Hello  World  ").trim().split(" ").at(0).camelCase().$;
```

### Line Manipulation

Handle multi-line strings with precision:

```typescript
// Remove empty lines
str("Hello\n\n\nWorld").chopRepeatNewlines(1).$; // "Hello\nWorld"

// Add line numbers
str("A\nB\nC").addLineNumbers().$; // "0:A\n1:B\n2:C"

// Trim empty lines and spaces
str("  \n  Hello  \n  ").trimEmptyLines().$; // "\nHello\n"
```

### Indentation Control

Manage text indentation with ease:

```typescript
// Add indentation
str("Hello\nWorld").indent(2).$; // "  Hello\n  World"

// Remove indentation
str("  Hello\n    World").dedent().$; // "Hello\n  World"

// Get indentation level
str("  Hello\n    World").indentation(); // 2
```

### Case Conversion

Convert between different case styles:

```typescript
str("hello-world").camelCase().$; // "helloWorld"
str("hello-world").pascalCase().$; // "HelloWorld"
str("hello-world").snakeCase().$; // "hello_world"
str("hello-world").constantCase().$; // "HELLO_WORLD"
str("hello-world").dotCase().$; // "hello.world"
str("hello-world").pathCase().$; // "hello/world"
```

### Utility Functions

All methods from the Str class are also available as standalone functions:

```typescript
import { trim, dedent, chopEmptyLinesStart } from "@synstack/str";

const result = trim("  hello  "); // 'hello'
```
