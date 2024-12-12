# @synstack/str

> Advanced chainable string manipulation utilities for TypeScript

This package provides a strongly-typed, chainable API for string manipulation with support for multiple case conversions and advanced text formatting operations.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## What is it for?

Working with strings should be simple and type-safe. This package turns verbose string operations into chainable, strongly-typed commands:

```typescript
import { str } from '@synstack/str'

// Basic chaining
const result = str('  Hello World  ')
  .trim()
  .split(' ')
  .at(0)
  .$

// Case conversion
const camelCase = str('hello-world').camelCase().$
console.log(camelCase) // 'helloWorld'

// Advanced manipulation
const formatted = str('    some\n  indented\n      text')
  .trimEmptyLines()
  .dedent()
  .$

// Line manipulation
const lines = str('line1\n\n\n\nline2')
  .chopRepeatNewlines(1)
  .split('\n')
console.log(lines) // ['line1', 'line2']
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

- 🔗 Chainable API for fluent string manipulation
- 📝 Rich set of string utilities (trim, chop, indent, etc.)
- 🔄 Case conversion utilities (camel, pascal, snake, etc.)
- 🎯 TypeScript-first with full type safety
- ⚡ Zero dependencies (except change-case)

## API Reference

### Str Class

The main class providing chainable string operations. Extends `Pipeable` from `@synstack/pipe`.

#### Chaining Methods

- `_((str) => result)`: Chain operations on the Str instance
- `_$((value) => result)`: Chain operations on the string value
- `$`: Get the underlying string value

#### String Operations

##### Trimming
- `trim()`: Remove leading and trailing whitespace
- `trimStart()`: Remove leading whitespace
- `trimEnd()`: Remove trailing whitespace
- `trimEmptyLines()`: Remove whitespace from empty lines
- `trimLinesTrailingSpaces()`: Remove trailing spaces from all lines

##### Line Manipulation
- `chopEmptyLinesStart()`: Remove empty lines at start
- `chopEmptyLinesEnd()`: Remove empty lines at end
- `chopRepeatNewlines(max: number)`: Limit consecutive newlines
- `addLineNumbers(separator?: string)`: Add line numbers to each line

##### Indentation
- `indent(size: number, char?: string)`: Indent all lines
- `dedent(size?: number)`: Remove indentation
- `indentation()`: Get the minimum indentation level
- `leadingSpacesCount()`: Count leading spaces

##### String Extraction
- `split(separator: string | RegExp)`: Split string into array
- `takeStart(count: number)`: Take first n characters
- `takeEnd(count: number)`: Take last n characters
- `firstLine()`: Get the first line
- `lastLine()`: Get the last line

##### Case Conversion
- `camelCase()`: Convert to camelCase
- `capitalCase()`: Convert to Capital Case
- `constantCase()`: Convert to CONSTANT_CASE
- `dotCase()`: Convert to dot.case
- `kebabCase()`: Convert to kebab-case
- `noCase()`: Convert to no case
- `pascalCase()`: Convert to PascalCase
- `pascalSnakeCase()`: Convert to Pascal_Snake_Case
- `pathCase()`: Convert to path/case
- `sentenceCase()`: Convert to Sentence case
- `snakeCase()`: Convert to snake_case
- `trainCase()`: Convert to Train-Case

### Utility Functions

All methods from the Str class are also available as standalone functions:

```typescript
import { trim, dedent, chopEmptyLinesStart } from '@synstack/str'

const result = trim('  hello  ') // 'hello'
```

## TypeScript Support

Full TypeScript support with generics and type inference. The library is written in TypeScript and provides type definitions out of the box.

```typescript
import { str } from '@synstack/str'

// Type inference works automatically
const result = str('hello')
  .trim()
  .split('')
  .at(0)
  .$

// result is inferred as string
```

## License

Apache-2.0
