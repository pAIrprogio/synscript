# @synstack/yaml

Opiniated and type-safe YAML serialization and deserialization with Zod schema validation

> [!NOTE]
> This package is accessible through [@synstack/fs](../fs/README.md) for convenience.

## What is it for?

This package provides a simple interface for working with YAML data in a type-safe way:

```typescript
import { deserialize, serialize } from "@synstack/yaml";
import { z } from "zod";

// Define a schema for type safety
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// Deserialize YAML with schema validation
const user = deserialize(
  `
name: John Doe
age: 30
`,
  { schema: userSchema },
);

console.log(user.name); // Type-safe access

// Serialize data with schema validation
const yaml = serialize({ name: "John", age: 30 }, { schema: UserSchema });
```

## Installation

```bash
npm install @synstack/yaml
# or
yarn add @synstack/yaml
# or
pnpm add @synstack/yaml
```

## Features

### YAML Deserialization

Convert YAML strings to JavaScript objects with optional schema validation:

```typescript
import { deserialize } from "@synstack/yaml";

// Basic deserialization
const data = deserialize<{ count: number }>("count: 42");
console.log(data.count); // TypeScript knows this is a number

// With schema validation
const config = deserialize("port: 3000", {
  schema: z.object({ port: z.number() }),
});
```

### YAML Serialization

Convert JavaScript objects to YAML strings with optional schema validation:

```typescript
import { serialize } from "@synstack/yaml";
import { z } from "zod";

// Basic serialization
const yaml = serialize({ hello: "world" });

// With schema validation
const validatedYaml = serialize(
  { port: 3000, host: "localhost" },
  { schema: z.object({ port: z.number(), host: z.string() }) },
);
```
