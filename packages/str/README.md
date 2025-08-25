# @synstack/str

Advanced chainable string manipulation utilities

## What is it for?

When working with strings in TypeScript, you often need to chain multiple operations like trimming, splitting, case conversion, and indentation management. This package provides a fluent, chainable API for string manipulation with full type safety:

```typescript
import { str } from "@synstack/str";

// Basic chaining
const result = str("  Hello World  ").trim().split(" ").$;

// Case conversion
const camelCase = str("hello-world").camelCase().$;
console.log(camelCase); // 'helloWorld'

// Advanced manipulation
const formatted = str("    some\n  indented\n      text")
  .trimEmptyLines()
  .dedent().$;

// Line manipulation
const lines = str("line1\n\n\n\nline2").chopRepeatNewlines(1).split("\n");
console.log(lines); // [Str('line1'), Str('line2')]
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
const result = str("  Hello  World  ").trim().split(" ");
const firstWord = result.at(0)?.camelCase().$; // 'hello'
```

### Basic String Operations

Core string manipulation methods:

```typescript
// Trimming
str("  Hello  ").trim().$;           // "Hello"
str("  Hello  ").trimStart().$;      // "Hello  "
str("  Hello  ").trimEnd().$;        // "  Hello"

// Character access and length
str("Hello").at(0);                  // "H"
str("Hello").at(-1);                 // "o"
str("Hello").length();               // 5

// String extraction
str("Hello World").takeStart(5).$;   // "Hello"
str("Hello World").takeEnd(5).$;     // "World"
str("Hello World").chopStart(6).$;   // "World"
str("Hello World").chopEnd(6).$;     // "Hello"

// String replacement
str("Hello World").replace("o", "0").$;     // "Hell0 World"
str("Hello World").replaceAll("o", "0").$;  // "Hell0 W0rld"

// String splitting
str("a,b,c").split(",");             // [Str("a"), Str("b"), Str("c")]
```

### Line Manipulation

Handle multi-line strings with precision:

```typescript
// Remove empty lines
str("Hello\n\n\nWorld").chopRepeatNewlines(1).$; // "Hello\nWorld"

// Remove empty lines from start/end
str("\n\n  Hello").chopEmptyLinesStart().$;      // "  Hello"
str("Hello  \n\n").chopEmptyLinesEnd().$;        // "Hello  "

// Clean up empty lines
str("Hello\n   \nWorld").trimEmptyLines().$;     // "Hello\n\nWorld"
str("Hello  \nWorld   ").trimLinesTrailingSpaces().$; // "Hello\nWorld"

// Line access
str("A\nB\nC").firstLine().$;        // "A"
str("A\nB\nC").lastLine().$;         // "C"

// Add line numbers
str("A\nB\nC").addLineNumbers().$;   // "0:A\n1:B\n2:C"
str("A\nB").addLineNumbers(" -> ").$; // "0 -> A\n1 -> B"
```

### Indentation Control

Manage text indentation with ease:

```typescript
// Add indentation
str("Hello\nWorld").indent(2).$;         // "  Hello\n  World"
str("A\nB").indent(3, "-").$;            // "---A\n---B"

// Remove indentation
str("  Hello\n    World").dedent().$;    // "Hello\n  World"
str("    A\n  B").dedent(2).$;           // "  A\nB"

// Get indentation information
str("  Hello\n    World").indentation(); // 2
str("  Hello").leadingSpacesCount();     // 2
```

### Case Conversion

Convert between different case styles:

```typescript
str("hello-world").camelCase().$;        // "helloWorld"
str("hello-world").pascalCase().$;       // "HelloWorld"
str("hello-world").snakeCase().$;        // "hello_world"
str("hello-world").constantCase().$;     // "HELLO_WORLD"
str("hello-world").kebabCase().$;        // "hello-world"
str("hello-world").dotCase().$;          // "hello.world"
str("hello-world").pathCase().$;         // "hello/world"

// Additional case styles
str("hello-world").capitalCase().$;      // "Hello World"
str("hello-world").sentenceCase().$;     // "Hello world"
str("hello-world").trainCase().$;        // "Hello-World"
str("hello-world").pascalSnakeCase().$;  // "Hello_World"
str("hello-world").noCase().$;           // "hello world"
```

### Utility Methods

Check string properties and states:

```typescript
// Check if empty
str("").isEmpty();                       // true
str("  \n  ").isEmpty();                 // true
str("Hello").isEmpty();                  // false
```

### Standalone Functions

All methods from the Str class are also available as standalone functions:

```typescript
import { 
  trim, dedent, chopEmptyLinesStart, addLineNumbers,
  camelCase, pascalCase, snakeCase 
} from "@synstack/str";

const result = trim("  hello  ");        // 'hello'
const indented = dedent("  A\n    B");   // 'A\n  B'
const camel = camelCase("hello-world");  // 'helloWorld'
```
