# @synstack/json

Schema-safe and type-safe JSON serialization and deserialization

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

> [!NOTE]
> This package is accessible through [@synstack/fs](../fs/README.md) for convenience.

## What is it for?

When you need to work with JSON data in a type-safe way, this package provides simple, strongly-typed functions:

```typescript
import { serialize, deserialize } from "@synstack/json";
import { z } from "zod";

// Define a schema for type safety
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// Serialize data with schema validation
const jsonString = serialize(
  { name: "John", age: 30 },
  { schema: userSchema, pretty: true },
);

// Deserialize with type inference
const user = deserialize(jsonString, { schema: userSchema });
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
const data = deserialize<{ count: number }>('{"count": 42}');
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
const configSchema = z.object({
  port: z.number(),
  host: z.string(),
  debug: z.boolean(),
});

// Validate during serialization
const jsonString = serialize(
  { port: 3000, host: "localhost", debug: true },
  { schema: configSchema },
);

// Validate during deserialization
const config = deserialize(jsonString, {
  schema: configSchema,
});
// config has type { port: number; host: string; debug: boolean }
```
