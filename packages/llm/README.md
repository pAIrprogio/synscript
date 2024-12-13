# @synstack/llm

> Immutable & chainable LLM tools with type-safe message handling

This package provides a strongly-typed, immutable API for interacting with Large Language Models, featuring chainable message building, type-safe tool handling, and flexible completion configuration.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## Documentation

Detailed documentation is available in separate files:
- [Tool Calls](docs/tool-calls.md) - Type-safe tool definitions and execution
- [Message Templating](docs/message-templating.md) - Immutable message building
- [Completions](docs/completion.md) - Completion configuration and execution
- [Runners](docs/runners.md) - Model-specific completion runners

## What is it for?

Working with Large Language Models should be type-safe and predictable. This package turns complex LLM interactions into chainable, immutable operations:

```typescript
import { CompletionBuilder, MessageTemplate } from "@synstack/llm";

// Create an immutable completion chain
const baseCompletion = CompletionBuilder.new
  .model("gpt-4")
  .temperature(0.7)
  .system("You are a helpful assistant");

// Each operation returns a new instance
const userCompletion = baseCompletion
  .user("What is TypeScript?");

// Messages are also immutable and chainable
const template = MessageTemplate.new
  .system("You are a helpful assistant")
  .user("Hello!")
  .assistant("How can I help?");
```

## Installation

```bash
# Using npm
npm install @synstack/llm

# Using yarn
yarn add @synstack/llm

# Using pnpm
pnpm add @synstack/llm
```

## Features

### Immutable Message Building

Build messages with a chainable, immutable API:

```typescript
import { userMsg, assistantMsg } from "@synstack/llm";

// User messages with text and images
const userMessage = userMsg`Here's an image: ${imageContent}`;

// Assistant messages with tool calls
const assistantMessage = assistantMsg`Let me help you with that ${toolCall}`;
```

### Type-Safe Content Types

Work with different types of message content:

```typescript
import { TextContent, ImageContent, ToolCallContent } from "@synstack/llm";

// Each content type has its own factory
const text = TextContent.from("Hello, world!");
const image = ImageContent.from({
  type: "base64",
  data: "...",
  mimeType: "image/png"
});

// Tool calls are strongly typed
const toolCall = ToolCallContent.from({
  toolCallId: "123",
  toolName: "calculator",
  toolArgs: { x: 1, y: 2 }
});
```

### Completion Configuration

Configure completions with immutable builders:

```typescript
import { CompletionBuilder } from "@synstack/llm";

const base = CompletionBuilder.new
  .model("gpt-4")
  .temperature(0.7);

// Create variations without modifying the base
const withTools = base.tools([calculator, translator]);
const withSystem = base.system("You are an expert");
```

### Provider-Agnostic Runners

Support for multiple LLM providers with a unified interface:

```typescript
import { AnthropicRunner, OpenAIRunner } from "@synstack/llm";

// Use any supported provider
const anthropic = new AnthropicRunner({ apiKey: "key" });
const openai = new OpenAIRunner({ apiKey: "key" });

// Same interface for all runners
const response = await runner.complete(completion);
```

## API Reference

### Message Builders

#### userMsg
- Template literal function for creating user messages
- Supports text, images, and tool responses

#### assistantMsg
- Template literal function for creating assistant messages
- Supports text and tool calls

### Content Classes

#### TextContent
- `from(text: string)` - Create text content
- `valueOf()` - Convert to message content format
- `toString()` - Get raw text content

#### ImageContent
- `from(image: Base64Image)` - Create image content
- `valueOf()` - Convert to message content format
- `image` - Access raw image data

#### ToolCallContent
- `from(toolCall: ToolCall)` - Create tool call content
- `valueOf()` - Convert to message content format
- `toolCall` - Access tool call details

#### ToolResponseContent
- `from(toolResponse: ToolResponse)` - Create tool response content
- `valueOf()` - Convert to message content format
- `toolResponse` - Access tool response details

### MessageContents

Enhanced array type with additional methods:
- `toolCalls()` - Filter and return tool call contents

## TypeScript Support

This package is written in TypeScript and provides:
- Full type inference for messages and tools
- Immutable builder patterns
- Type-safe parameter validation
- Provider-specific type definitions
- Strongly typed content classes

## License

Apache-2.0 - see LICENSE file for details.
