# Tool Calls in @synstack/llm

> Type-safe tool definitions and execution for LLM interactions

This document describes how to define and use tools with Large Language Models in a type-safe manner.

## What are Tool Calls?

Tool calls allow Large Language Models to interact with external functions in a structured way. The @synstack/llm package provides a type-safe way to define tools and handle their execution, with support for both single-tool and multi-tool configurations.

## Features

### Type-Safe Tool Definitions

Define tools with complete type safety using Zod schemas:

```typescript
import { z } from "zod";
import { type Tool } from "@synstack/llm";

const calculator: Tool = {
  name: "calculator",
  schema: z.object({
    operation: z.enum(["add", "subtract", "multiply", "divide"]),
    a: z.number(),
    b: z.number()
  })
};
```

### Tool Configuration

Configure tool usage in completions:

```typescript
import { CompletionBuilder } from "@synstack/llm";

// Single tool mode - LLM will always use this tool
const singleTool = CompletionBuilder.new
  .tool(calculator);

// Multi-tool mode - LLM can choose which tool to use
const multiTool = CompletionBuilder.new
  .tools([calculator, translator], true); // true = require tool use
```

### Provider-Specific Implementation

Tools are mapped to provider-specific formats:

```typescript
// Anthropic format
{
  type: "tool_use",
  id: "tool-123",
  name: "calculator",
  input: { operation: "add", a: 1, b: 2 }
}

// OpenAI format
{
  type: "function",
  function: {
    name: "calculator",
    arguments: { operation: "add", a: 1, b: 2 }
  }
}
```

## API Reference

### Tool Type

```typescript
type Tool<
  TName extends string = string,
  TSchema extends ZodSchema = AnyZodObject,
> = {
  name: TName;
  schema: TSchema;
};
```

### Tool Configuration Types

```typescript
type ToolConfig = Single | Multi;

type Single<TTool extends Tool = Tool> = {
  type: "single";
  tool: TTool;
};

type Multi<
  TTools extends Array<Tool> = Array<Tool>,
  TRequire extends boolean = boolean,
> = {
  type: "multi";
  tools: TTools;
  requireToolUse: TRequire;
};
```

### Tool Call Content

```typescript
type ToolCall<TTool extends Tool = Tool> = {
  type: "tool_call";
  toolCallId: string;
  toolName: TTool["name"];
  toolArgs: z.output<TTool["schema"]>;
};
```

### Tool Response Content

```typescript
type ToolResponse = {
  type: "tool_response";
  toolCallId: string;
  toolOutput: any;
};
```

## Provider Differences

### Anthropic
- Uses `tool_use` format
- Tool calls include unique IDs
- Arguments passed directly in `input` field

### OpenAI
- Uses function call format
- Arguments wrapped in `function.arguments`
- Supports required tool usage flag

## TypeScript Support

The tool system provides:
- Full type inference for tool parameters
- Schema validation using Zod
- Provider-specific type mappings
- Strongly typed tool responses

## License

Apache-2.0 - see LICENSE file for details.
