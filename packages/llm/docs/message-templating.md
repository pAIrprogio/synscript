# Message Templating in @synstack/llm

> Type-safe message building with role-specific content types

This document describes how to build messages for Large Language Model interactions using type-safe template literals and role-specific content types.

## What is Message Templating?

Message templating provides a type-safe way to construct messages for LLM interactions using template literals. The system enforces role-specific content types and provides proper type inference.

## Features

### User Messages

Create user messages with support for text, images, and tool responses:

```typescript
import { userMsg } from "@synstack/llm";

// Text-only message
const textMsg = userMsg`Hello, how can you help me?`;

// Message with image
const imageMsg = userMsg`Here's an image: ${base64Image}`;

// Message with tool response
const toolMsg = userMsg`Previous calculation: ${toolResponse}`;
```

### Assistant Messages

Create assistant messages with support for text and tool calls:

```typescript
import { assistantMsg } from "@synstack/llm";

// Text-only message
const textMsg = assistantMsg`I can help you with various tasks.`;

// Message with tool call
const toolMsg = assistantMsg`Let me calculate that: ${toolCall}`;
```

### Content Type Safety

Role-specific content types are enforced:

```typescript
// User messages can contain:
type UserContent =
  | TextContent          // Plain text
  | ImageContent         // Base64 images
  | ToolResponseContent; // Tool responses

// Assistant messages can contain:
type AssistantContent =
  | TextContent    // Plain text
  | ToolCallContent; // Tool calls
```

## API Reference

### Message Template Functions

```typescript
// User message template
function userMsg<T extends Array<Text | Base64Data | ToolResponse>>(
  template: TemplateStringsArray,
  ...values: T
): Llm.User.Message;

// Assistant message template
function assistantMsg<T extends Array<Text | ToolCall>>(
  template: TemplateStringsArray,
  ...values: T
): Llm.Assistant.Message;
```

### Message Types

```typescript
type Message = {
  role: "user" | "assistant";
  content: Array<MessageContent>;
};

type MessageContent =
  | TextContent
  | ImageContent
  | ToolCallContent
  | ToolResponseContent;
```

## Implementation Details

### Content Type Restrictions
- User messages: text, images, tool responses
- Assistant messages: text, tool calls
- No mixing of incompatible types
- Type checking at compile time

### Template Processing
- Uses @synstack/text for parsing
- Pipe-based transformations
- Type-safe interpolation
- Role-specific validation

## TypeScript Support

The message templating system provides:
- Type inference for template values
- Role-specific content validation
- Compile-time type checking
- Full IntelliSense support

## License

Apache-2.0 - see LICENSE file for details.
