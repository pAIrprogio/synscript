import { Anthropic } from "@anthropic-ai/sdk";
import { fsCache, t } from "@synstack/synscript";
import { AnthropicRunner, runner } from "@synstack/synscript/anthropic";
import { completion } from "@synstack/synscript/llm";
import { reforgeDir } from "./workspace.runtime.ts";

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const cacheDir = reforgeDir.to(".cache");

export const baseCache = fsCache(cacheDir);

export const completionRunner = runner
  .client(anthropicClient)
  .model(AnthropicRunner.MODELS.CLAUDE_3_5_MEDIUM)
  .continues(3)
  .retries(2);

export const baseCompletion = completion.maxTokens(4000).temperature(0.5)
  .system(t`
    You are an expert software developer.
  `);
