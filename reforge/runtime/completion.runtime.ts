import { createAnthropic } from "@ai-sdk/anthropic";
import { fsCache } from "@synstack/fs-cache";
import { completion } from "@synstack/llm";
import { includeAssistantMessage } from "@synstack/llm/middleware";
import { reforgeDir } from "./workspace.runtime.ts";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const cacheDir = reforgeDir.to(".cache");

export const baseCache = fsCache(cacheDir);

export const baseCompletion = completion
  .maxTokens(8000)
  .temperature(0.5)
  .middlewares([includeAssistantMessage])
  .model(anthropic("claude-3-7-sonnet-20250219"))
  .maxSteps(3)
  .maxRetries(2);
