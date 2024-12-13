# Completions in @synstack/llm

> Type-safe completion configuration with immutable builders

This document describes how to configure and execute completions with Large Language Models using type-safe, immutable builders.

## What are Completions?

Completions are the core interaction method with Large Language Models. The completion builder provides a type-safe way to configure these interactions while maintaining immutability.

## Features

### Immutable Configuration

Configure completions using an immutable builder pattern:

```typescript
import { CompletionBuilder } from "@synstack/llm";

const completion = CompletionBuilder.new
  .temperature(0.7)
  .maxTokens(1000)
  .system("You are a helpful assistant")
  .user("Tell me about TypeScript");
```

### Type-Safe Parameters

All completion parameters are type-checked:

```typescript
const completion = CompletionBuilder.new
  .temperature(0.7)        // Must be between 0 and 1
  .maxTokens(1000)        // Must be a positive integer
  .topP(0.9)              // Must be between 0 and 1
  .topK(40)               // Must be a positive integer
  .stopSequences(["###"]); // Must be an array of strings
```

### Tool Configuration

Configure tool usage with type safety:

```typescript
// Single tool mode
const singleTool = completion.tool(calculator);

// Multi-tool mode
const multiTool = completion.tools([calculator, translator], true);
```

## API Reference

### CompletionBuilder Class

```typescript
class CompletionBuilder<T extends Resolvable<Llm.Completion.Partial>> {
  // Core configuration
  temperature(value: number): CompletionBuilder;
  maxTokens(value: number): CompletionBuilder;
  system(content: string): CompletionBuilder;

  // Advanced parameters
  topK(value: number): CompletionBuilder;
  topP(value: number): CompletionBuilder;
  stopSequences(sequences: string[]): CompletionBuilder;

  // Tool configuration
  tool(tool: Tool): CompletionBuilder;
  tools(tools: Tool[], requireToolUse?: boolean): CompletionBuilder;
  clearTools(): CompletionBuilder;

  // Message handling
  messages(messages: Message[]): CompletionBuilder;
  addMessages(messages: Message[]): CompletionBuilder;
  addAssistantMessage(message: AssistantMessage): CompletionBuilder;

  // Execution
  run(runner: CompletionRunner): Promise<CompletionBuilder>;
}
```

### Completion Type

```typescript
type Completion = {
  temperature: number;
  maxTokens: number;
  messages: Array<Message>;
  system?: string;
  topK?: number;
  topP?: number;
  stopSequences?: string[];
  toolsConfig?: ToolConfig;
  usage?: Usage;
  stopReason?: StopReason;
};
```

## Implementation Details

### Immutability
- Each method returns new instance
- Uses merge pattern internally
- Original completion unchanged
- Thread-safe operations

### Type Safety
- Generic type parameters
- Parameter validation
- Tool configuration types
- Message content validation

### Response Handling
- Usage tracking
- Stop reason tracking
- Tool response handling
- Message accumulation

## TypeScript Support

The completion system provides:
- Type-safe parameter configuration
- Immutable operations
- Full IntelliSense support
- Generic type inference

## License

Apache-2.0 - see LICENSE file for details.
