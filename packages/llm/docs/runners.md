# LLM Runners in @synstack/llm

> Provider-specific completion runners for different LLM providers

This document describes how to use different LLM runners to execute completions with various model providers.

## What are Runners?

Runners are responsible for executing completions with specific LLM providers. Each runner is optimized for its respective provider's API and requirements, with built-in support for retries, caching, and provider-specific features.

## Features

### Anthropic Runner

```typescript
import { AnthropicRunner } from "@synstack/llm";

// Create a new runner instance
const runner = AnthropicRunner.new
  .client(anthropicClient)
  .model(AnthropicRunner.MODELS.CLAUDE_3_MEDIUM)
  .retries(3)
  .retryBackoff(1000)
  .continues(2)
  .cache(cacheImplementation);

// Available models
const models = {
  CLAUDE_3_SMALL: "claude-3-haiku-20240307",
  CLAUDE_3_MEDIUM: "claude-3-sonnet-20240229",
  CLAUDE_3_LARGE: "claude-3-opus-20240229",
  CLAUDE_3_5_MEDIUM: "claude-3-5-sonnet-latest",
};
```

### OpenAI Runner

```typescript
import { OpenAIUtils } from "@synstack/llm";

// Available models
const models = {
  GPT_3_5_TURBO: "gpt-3.5-turbo",
  GPT_4: "gpt-4",
  GPT_4_TURBO: "gpt-4-turbo",
  GPT_4O: "gpt-4o",
  GPT_4O_MINI: "gpt-4o-mini",
};
```

### Runner Configuration

#### Anthropic-specific options:
- `retries`: Number of retry attempts for failed requests
- `retryBackoff`: Delay in milliseconds between retries
- `continues`: Number of continuation attempts for max_tokens responses
- `cache`: Optional cache implementation for responses

## API Reference

### CompletionRunner Interface

```typescript
interface CompletionRunner<TCompletion extends Llm.Completion.Partial> {
  chatCompletion(
    completion: CompletionBuilder<Resolvable<TCompletion>>,
  ): Promise<{
    message: Llm.Assistant.Message;
    usage: Llm.Completion.Usage;
    stopReason: Llm.Completion.StopReason;
  }>;

  runChatCompletion<T extends TCompletion>(
    completion: CompletionBuilder<Resolvable<T>>,
  ): Promise<CompletionBuilder<Merge<T, Llm.Completion.Response.Part>>>;
}
```

### Response Types

```typescript
type Response = {
  message: Llm.Assistant.Message;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  stopReason: "end" | "max_tokens" | "tool_call" | "stop_sequence";
};
```

## Provider-Specific Features

### Anthropic
- Automatic retry mechanism with configurable backoff
- Continuation support for max_tokens responses
- Response caching capability
- Tool calls using Anthropic's tool_use format
- Stop sequence handling with suffix support

### OpenAI
- Function call format for tools
- System message handling as separate messages
- Required tool usage configuration
- Image URL support in messages

## TypeScript Support

The runner system provides:
- Type-safe configuration options
- Provider-specific type definitions
- Full IntelliSense support
- Strongly typed responses

## License

Apache-2.0 - see LICENSE file for details.
