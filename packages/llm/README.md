# @synstack/llm

> Type-safe LLM message handling and content management

This package provides a strongly-typed API for working with LLM messages, including support for text, images, tool calls, and tool responses.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## What is it for?

Working with LLM messages should be type-safe and intuitive. This package provides a structured way to create and handle different types of message content:

```typescript
import { userMsg, assistantMsg } from "@synstack/llm";

// Create strongly-typed user messages with text and images
const message = userMsg`Here's my question: ${TextContent.from("How does this work?")}`;

// Handle tool calls and responses in assistant messages
const toolCall = ToolCallContent.from({
  toolCallId: "123",
  toolName: "calculator",
  toolArgs: { x: 1, y: 2 }
});
const response = assistantMsg`Let me calculate that for you ${toolCall}`;
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

### Message Building

Create type-safe messages using template literals:

```typescript
import { userMsg, assistantMsg } from "@synstack/llm";

// User messages with text and images
const userMessage = userMsg`Here's an image: ${imageContent}`;

// Assistant messages with tool calls
const assistantMessage = assistantMsg`Let me help you with that ${toolCall}`;
```

### Content Types

Work with different types of message content:

```typescript
import { type Llm } from "@synstack/llm";

// Text content
const text: Llm.Message.Content.Text = {
  type: "text",
  text: "Hello, world!"
};

// Image content
const image: Llm.Message.Content.Image = {
  type: "image",
  image: {
    type: "base64",
    data: "...",
    mimeType: "image/png"
  }
};

// Tool calls are strongly typed
const toolCall: Llm.Message.Content.ToolCall = {
  type: "tool_call",
  toolCallId: "123",
  toolName: "calculator",
  toolArgs: { x: 1, y: 2 }
};
```

### Tool Configuration

Configure tool usage with type-safe definitions:

```typescript
import { type Llm } from "@synstack/llm";
import { z } from "zod";

// Define a tool with Zod schema
const calculator: Llm.Tool = {
  name: "calculator",
  schema: z.object({
    x: z.number(),
    y: z.number()
  })
};

// Use in completion configuration
const config: Llm.Completion = {
  temperature: 0.7,
  maxTokens: 1000,
  messages: [],
  toolsConfig: {
    type: "single",
    tool: calculator
  }
};
```

## API Reference

### Message Functions

#### userMsg
- Template literal function for creating user messages
- Supports text, images, and tool responses
- Returns `Llm.User.Message`

#### assistantMsg
- Template literal function for creating assistant messages
- Supports text and tool calls
- Returns `Llm.Assistant.Message`

### Message Types

#### Llm.Message.Content.Text
```typescript
{
  type: "text";
  text: string;
}
```

#### Llm.Message.Content.Image
```typescript
{
  type: "image";
  image: {
    type: "base64";
    data: string;
    mimeType: string;
  };
}
```

#### Llm.Message.Content.ToolCall
```typescript
{
  type: "tool_call";
  toolCallId: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
}
```

#### Llm.Message.Content.ToolResponse
```typescript
{
  type: "tool_response";
  toolCallId: string;
  toolOutput: unknown;
}
```

## TypeScript Support

This package is written in TypeScript and provides:
- Full type inference for messages and tools
- Type-safe parameter validation
- Strongly typed content interfaces
- Zod schema validation for tool arguments

## License

Apache-2.0 - see LICENSE file for details.
