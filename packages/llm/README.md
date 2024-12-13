# @synstack/llm

> Type-safe LLM message handling and content management

This package provides a strongly-typed API for working with LLM messages, including support for text, images, tool calls, and tool responses.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## What is it for?

Working with LLM messages should be type-safe and intuitive. This package provides a structured way to create and handle different types of message content:

```typescript
import { userMsg, assistantMsg, TextContent, ToolCallContent } from "@synstack/llm";

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
import { TextContent, ImageContent, ToolCallContent, ToolResponseContent } from "@synstack/llm";

// Text content
const text = TextContent.from("Hello, world!");

// Image content (base64)
const image = ImageContent.from({
  type: "base64",
  data: "...",
  mimeType: "image/png"
});

// Tool calls
const toolCall = ToolCallContent.from({
  toolCallId: "123",
  toolName: "calculator",
  toolArgs: { x: 1, y: 2 }
});

// Tool responses
const toolResponse = ToolResponseContent.from({
  toolCallId: "123",
  toolOutput: { result: 3 }
});
```

### Message Content Arrays

Handle collections of message contents:

```typescript
import { MessageContents } from "@synstack/llm";

// Create enhanced array of contents
const contents = MessageContents([textContent, toolCallContent]);

// Filter tool calls
const toolCalls = contents.toolCalls();
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

This package is written in TypeScript and provides comprehensive type definitions:

- Generic type parameters for message content
- Type-safe message builders using template literals
- Strongly typed content classes
- Type inference for tool calls and responses

## License

Apache-2.0 - see LICENSE file for details.
