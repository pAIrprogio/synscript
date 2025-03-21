import { fsCache } from "@synstack/fs-cache";
import { MockLanguageModelV1, simulateReadableStream } from "ai/test";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Llm } from "./llm.types.ts";
import { cacheCalls, includeAssistantMessage } from "./model.middleware.ts";

describe("includeAssistantMessage", () => {
  it("adds the last assistant message to a generated output", async () => {
    const model = new MockLanguageModelV1({
      doGenerate: () =>
        Promise.resolve({
          rawCall: { rawPrompt: null, rawSettings: {} },
          finishReason: "stop",
          usage: { promptTokens: 10, completionTokens: 20 },
          text: " world!",
        }),
    });

    const wrappedModel = includeAssistantMessage(model);

    const res = await wrappedModel.doGenerate({
      inputFormat: "messages",
      mode: { type: "regular" },
      prompt: [
        {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Hello",
            },
          ],
        },
      ],
    });

    assert.equal(res.text, "Hello world!");
  });

  it("adds the last assistant message to a stream output", async () => {
    const model = new MockLanguageModelV1({
      doStream: () =>
        Promise.resolve({
          rawCall: { rawPrompt: null, rawSettings: {} },
          stream: simulateReadableStream({
            chunks: [
              { type: "text-delta", textDelta: " " },
              { type: "text-delta", textDelta: "world" },
              { type: "text-delta", textDelta: "!" },
              {
                type: "finish",
                finishReason: "stop",
                usage: { promptTokens: 10, completionTokens: 20 },
              },
            ] satisfies Array<Llm.Model.Stream.Part>,
            chunkDelayInMs: 100,
          }),
        }),
    });

    const wrappedModel = includeAssistantMessage(model);

    const res = await wrappedModel.doStream({
      inputFormat: "messages",
      mode: { type: "regular" },
      prompt: [
        {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Hello",
            },
          ],
        },
      ],
    });

    let output = "";

    for await (const chunk of res.stream) {
      if (chunk.type !== "text-delta") continue;
      output += chunk.textDelta;
    }

    assert.equal(output, "Hello world!");
  });
});

describe("cache", () => {
  it("uses the cache of the model", async () => {
    const cache = fsCache("src/test_files/cache").key(["generate"]);

    const model = new MockLanguageModelV1({
      doGenerate: () => {
        throw new Error("Should not be called");
      },
    });

    const wrappedModel = cacheCalls(cache)(model);

    const res = await wrappedModel.doGenerate({
      inputFormat: "messages",
      mode: { type: "regular" },
      prompt: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Hello",
            },
          ],
        },
      ],
    });

    assert.equal(res.text, " world!");
  });

  it("uses the cache of a stream", async () => {
    const cache = fsCache("src/test_files/cache").key(["stream"]);

    const model = new MockLanguageModelV1({
      doStream: () => {
        throw new Error("Should not be called");
      },
    });

    const wrappedModel = cacheCalls(cache)(model);

    const res = await wrappedModel.doStream({
      inputFormat: "messages",
      mode: { type: "regular" },
      prompt: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Hello",
            },
          ],
        },
      ],
    });

    let output = "";

    for await (const chunk of res.stream) {
      if (chunk.type !== "text-delta") continue;
      output += chunk.textDelta;
    }

    assert.equal(output, " world!");
  });
});
