# @synstack/llm

Immutable, chainable, and type-safe wrapper of Vercel's AI SDK.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## Installation

```bash
pnpm add @synstack/llm ai zod
yarn add @synstack/llm ai zod
npm install @synstack/llm ai zod
```

To add models you need to install the appropriate [provider package](https://sdk.vercel.ai/providers/ai-sdk-providers):

```bash
pnpm add @ai-sdk/openai // or @ai-sdk/[provider-name]
yarn add @ai-sdk/openai // or @ai-sdk/[provider-name]
npm install @ai-sdk/openai // or @ai-sdk/[provider-name]
```

## Features

### Completion Building

The completion builder provides a type-safe API to configure LLM completions:

```ts
import { completion } from "@synstack/llm"; // or @synstack/synscript/llm
import { openai } from "@ai-sdk/openai";

const baseCompletion = completion
  .model(openai("gpt-4"))
  .maxTokens(20)
  .temperature(0.8);

const imageToLanguagePrompt = (imagePath: string) => [
  systemMsg`
    You are a helpful assistant that can identify the language of the text in the image.
  `,
  userMsg`
    Here is the image: ${filePart.fromFile(imagePath)}
  `,
  assistantMsg`
    The language of the text in the image is
  `,
];

const imageToLanguageAgent = (imagePath: string) =>
  baseCompletion.prompt(imageToLanguagePrompt(imagePath)).generateText();
```

#### Model Configuration

- `model()`: Set the language model
- `maxTokens()`: Set maximum tokens to generate
- `temperature()`: Set temperature (0-1)
- `topP()`, `topK()`: Configure sampling parameters
- `frequencyPenalty()`, `presencePenalty()`: Adjust output diversity
- `seed()`: Set random seed for deterministic results

#### Flow Control

- `maxSteps()`: Maximum number of sequential LLM calls
- `maxRetries()`: Number of retry attempts
- `stopSequences()`: Define sequences that stop generation
- `abortSignal()`: Cancel ongoing completions

#### Generation Methods

- `generateText()`: Generate text completion
- `streamText()`: Stream text completion
- `generateObject()`: Generate structured object
- `streamObject()`: Stream structured object

### Message Building

Messages can be built using template strings with various features:

- Add promises or array of promises in your template string as if they were synchronous
- Format your prompt for readability with automatic trimming and padding removal
- Type-safe template values that prevent invalid prompt content

Template-based message builders for different roles:

```ts
// System messages
systemMsg`
  You are a helpful assistant.
`;

// User messages with support for text, images and files
userMsg`
  Here is the image: ${filePart.fromFile("./image.png")}
`;

// Assistant messages with support for text and tool calls
assistantMsg`
  The language of the text in the image is
`;
```

### File Handling

The `filePart` utility provides methods to handle files and images, and supports automatic mime-type detection:

```ts
// Load from file system
filePart.fromFile(path, mimeType?)

// Load from base64 string
filePart.fromBase64(base64, mimeType?)

// Load from URL
filePart.fromUrl(url, mimeType?)
```

### Tool Usage

Tools can be configured in completions for function calling with type safety:

```ts
const completion = baseCompletion
  .tools({
    search: {
      description: "Search for information",
      parameters: z.object({
        query: z.string(),
      }),
    },
  })
  .activeTools(["search"])
  .toolChoice("auto"); // or 'none', 'required', or { type: 'tool', toolName: 'search' }
```

### Model Middlewares

The library provides middleware utilities to enhance model behavior:

```ts
import { includeAssistantMessage, cacheCalls } from "@synstack/llm/middleware";
import { fsCache } from "@synstack/fs-cache";

// Apply middlewares to completion
const completion = baseCompletion
  .middlewares([includeAssistantMessage]) // Include last assistant message in output
  .prependMiddlewares([cacheCalls(cache)]); // Cache model responses

// Apply middlewares directly to the model
const modelWithAssistant = includeAssistantMessage(baseModel);
const modelWithCache = cacheCalls(cache)(baseModel);
```

- `middlewares()`: Replace the middlewares
- `prependMiddlewares()`: Add middlewares to the beginning of the chain to be executed first
- `appendMiddlewares()`: Add middlewares to the end of the chain to be executed last

For more details on available options, please refer to Vercel's AI SDK documentation:

- [generateText](https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-text)
- [streamText](https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-text)
- [generateObject](https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-object)
- [streamObject](https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-object)
