# @synstack/json

> Type-safe JSON serialization and deserialization with schema validation

This package provides a strongly-typed interface for working with JSON data, including serialization, deserialization, and schema validation using Zod.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## What is it for?

When you need to work with JSON data in a type-safe way, this package provides simple, strongly-typed functions:

```typescript
import { serialize, deserialize } from "@synstack/json";
import { z } from "zod";

// Define a schema for type safety
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// Serialize data with schema validation
const jsonString = serialize(
  { name: "John", age: 30 },
  { schema: UserSchema, pretty: true }
);

// Deserialize with type inference
const user = deserialize(jsonString, { schema: UserSchema });
console.log(user.name); // Type-safe access

// Handle invalid JSON gracefully
try {
  deserialize("invalid json");
} catch (error) {
  if (error instanceof JsonParseException) {
    console.error("Failed to parse JSON:", error.message);
  }
}
```

## Installation

```bash
# Using npm
npm install @synstack/json

# Using yarn
yarn add @synstack/json

# Using pnpm
pnpm add @synstack/json
```

## Features

### JSON Serialization

Convert JavaScript objects to JSON strings with optional pretty printing:

```typescript
import { serialize } from "@synstack/json";

// Basic serialization
const json = serialize({ hello: "world" });

// Pretty printing
const prettyJson = serialize({ hello: "world" }, { pretty: true });
console.log(prettyJson);
// {
//   "hello": "world"
// }
```

### Type-Safe Deserialization

Parse JSON strings with TypeScript type inference:

```typescript
import { deserialize } from "@synstack/json";

// Basic deserialization
const data = deserialize<{ count: number }>(
  '{"count": 42}'
);
console.log(data.count); // TypeScript knows this is a number

// Handle parsing errors
try {
  deserialize('{"invalid": json}');
} catch (error) {
  console.error("Invalid JSON:", error.message);
}
```

### Schema Validation

Use Zod schemas for runtime type checking:

```typescript
import { serialize, deserialize } from "@synstack/json";
import { z } from "zod";

// Define a schema
const ConfigSchema = z.object({
  port: z.number(),
  host: z.string(),
  debug: z.boolean(),
});

// Validate during serialization
const jsonString = serialize(
  { port: 3000, host: "localhost", debug: true },
  { schema: ConfigSchema }
);

// Validate during deserialization
const config = deserialize(jsonString, {
  schema: ConfigSchema,
});
// config has type { port: number; host: string; debug: boolean }
```

## API Reference

### Functions

#### `serialize(data, config?)`
Convert data to a JSON string:
- `data` - The data to serialize
- `config.pretty` - Whether to pretty print (indent with 2 spaces)
- `config.schema` - Optional Zod schema for validation
- Returns: JSON string

#### `deserialize<T>(content, config?)`
Parse a JSON string to data:
- `content` - The JSON string to parse
- `config.schema` - Optional Zod schema for validation
- Returns: Parsed data of type T

### Classes

#### `JsonParseException`
Error thrown when JSON parsing fails:
- Contains detailed error message
- Includes original JSON string
- Preserves underlying cause

## TypeScript Support

This package is written in TypeScript and provides full type definitions:
- Generic type parameters for deserialization
- Zod schema integration for runtime validation
- Type inference from schemas
- Strongly typed error handling

## License

Apache-2.0 - see LICENSE file for details.
