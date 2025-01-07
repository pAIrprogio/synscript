# @synstack/llm

Immutable, chainable, and type-safe wrapper of Vercel's AI SDK.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## Sample usage

```ts
import { completion } from "@synstack/llm"; // or @synstack/synscript/llm
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
    Here is the image: ${filePart.fromFile(imagePath)}
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

The completion builder provides a type-safe API to configure LLM completions:

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

As these template strings use [@synstack/text](https://github.com/pAIrprogio/synscript/tree/main/packages/text), there are several features embeded in message templates:

- Aadd promises or array of promises in your template string as if they were synchronous. Resolution is handled for you.
- Format your prompt for readability. Trimming and removing extra padding is done on string resolution.
- Template values are type-safe, you cannot add a value that is not usable in the prompt.

To sum it up, this is valid:

```ts
const agent = completion.messages([
  userMsg`
    You are a helpful assistant.
    ${[
      Promise.resolve("- Read the image"),
      Promise.resolve("- Describe the image"),
    ]}
    ${filePart.fromFile("./image.png")}
  `,
]);
```

And will resolve to:

```yaml
messages:
  - role: user
    content:
      - type: text
      - text: |--
        You are a helpful assistant.
          - Read the image
          - Describe the image
      - type: image
        mimeType: image/png
        image: ...base64Data...
```

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
    Here is the image: ${filePart.fromFile("./image.png")}
  `;
  ```

- `assistantMsg`: Create assistant messages with support for text and tool calls
  ```ts
  assistantMsg`
    The language of the text in the image is
  `;
  ```

### File handling

The `filePart` utility provides methods to handle files and images:

- `filePart.fromFile(path, mimeType?)`: Load file or image from path
- `filePart.fromBase64(base64, mimeType?)`: Load from base64 string
- `filePart.fromUrl(url, mimeType?)`: Load from URL

Supports automatic mime-type detection and handles both images and files appropriately.

### Tool usage

Tools can be configured in completions for function calling and every tool function will remain type-safe:

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

### Model middlewares

The library provides middleware utilities to enhance model behavior:

- **includeAssistantMessage**: Prepends the last assistant message to the output

  ```ts
  import { includeAssistantMessage } from "@synstack/llm/middleware"; // or @synstack/synscript/llm/middleware
  const modelWithAssistant = includeAssistantMessage(baseModel);
  ```

- **cacheCalls**: Caches model responses using @synstack/fs-cache

  ```ts
  import { cacheCalls } from "@synstack/llm/middleware"; // or @synstack/synscript/llm/middleware
  import { fsCache } from "@synstack/fs-cache"; // or @synstack/synscript

  const cache = fsCache("path/to/cache").key(["generate"]);
  const modelWithCache = cacheCalls(cache)(baseModel);
  ```

These middlewares can be added by using the `.middlewares`, `.prependMiddlewares` and `.appendMiddlewares` methods on completion to load them dynamically.

```ts
const baseCompletion = completion.middlewares([includeAssistantMessage])(
  baseModel,
);

// And later on

baseCompletion
  // We prepend so that caching is closest to the actual LLM call
  .prependMiddlewares([cacheCalls(cache).key(["generate"])])
  .generateText();
```
