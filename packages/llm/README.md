# @synstack/llm

Immutable, chainable, and type-safe wrapper of Vercel's AI SDK.

## Sample usage

```ts
import { completion } from "@synstack/llm";
import { openai } from "@ai-sdk/openai";

const baseCompletion = completion
  .model(openai("gpt-4o"))
  .maxTokens(20)
  .temperature(0.8);

const imageToLanguagePrompt = (imagePath: string) => [
  systemMsg`
    You are a helpful assistant that can identify the language of the text in the image.
  `,
  userMsg`
    Here is the image: ${messagePart.fromFile(imagePath)}
  `,
  assistantMsg`
    The language of the text in the image is
  `,
];

const imageToLanguageAgent = (imagePath: string) =>
  baseCompletion.prompt(imageToLanguagePrompt(imagePath)).generateText();
```

## Installation

```bash
pnpm add @synstack/llm ai
yarn add @synstack/llm ai
npm install @synstack/llm ai
```

## Features

To get a better understanding of every option available, please read Vercel's AI SDK documentation:

- [generateText](https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-text)
- [streamText](https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-text)
- [generateObject](https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-object)
- [streamObject](https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-object)

### Completion building

The completion builder provides a fluent API to configure LLM completions:

- **Model Configuration**

  - `model()`: Set the language model
  - `maxTokens()`: Set maximum tokens to generate
  - `temperature()`: Set temperature (0-1)
  - `topP()`, `topK()`: Configure sampling parameters
  - `frequencyPenalty()`, `presencePenalty()`: Adjust output diversity
  - `seed()`: Set random seed for deterministic results

- **Flow Control**

  - `maxSteps()`: Maximum number of sequential LLM calls
  - `maxRetries()`: Number of retry attempts
  - `stopSequences()`: Define sequences that stop generation
  - `abortSignal()`: Cancel ongoing completions

- **Generation Methods**
  - `generateText()`: Generate text completion
  - `streamText()`: Stream text completion
  - `generateObject()`: Generate structured object
  - `streamObject()`: Stream structured object

### Message building

Template-based message builders for different roles:

- `systemMsg`: Create system messages

  ```ts
  systemMsg`
    You are a helpful assistant.
  `;
  ```

- `userMsg`: Create user messages with support for text, images and files

  ```ts
  userMsg`
    Here is the image: ${messagePart.fromFile("./image.png")}
  `;
  ```

- `assistantMsg`: Create assistant messages with support for text and tool calls
  ```ts
  assistantMsg`
    The language of the text in the image is
  `;
  ```

As these template strings use [@synstack/text](https://github.com/pAIrprogio/synscript/tree/main/packages/text)

### File handling

The `messagePart` utility provides methods to handle files and images:

- `messagePart.fromFile(path, mimeType?)`: Load file or image from path
- `messagePart.fromBase64(base64, mimeType?)`: Load from base64 string
- `messagePart.fromUrl(url, mimeType?)`: Load from URL

Supports automatic mime-type detection and handles both images and files appropriately.

### Tool usage

Tools can be configured in completions for function calling:

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
  .toolChoice("auto"); // or 'none', 'required', or { type: 'tool', toolName: 'search' }
```
