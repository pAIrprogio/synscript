import { tool } from "ai";
import { MockLanguageModelV1 } from "ai/test";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";
import { assertType } from "../../shared/src/ts.utils.ts";
import { completion } from "./completion.builder.ts";
import type { Llm } from "./llm.types.ts";
import { userMsg } from "./message.builder.ts";

describe("CompletionBuilder", () => {
  const _typesTesting = async () => {
    // Assert base completion
    const builder = completion;
    assertType<{}>(builder.options);

    // Assert configured completion
    const expected = {
      maxTokens: 100,
      temperature: 1,
      topP: 2,
      topK: 2,
      frequencyPenalty: 3,
      presencePenalty: 4,
      seed: 5,
      stopSequences: ["a", "b"],
      maxRetries: 1,
      abortSignal: new AbortSignal(),
      maxSteps: 1,
    } satisfies Llm.Completion.Partial;

    const configuredBuilder = builder
      .maxTokens(expected.maxTokens)
      .temperature(expected.temperature)
      .topP(expected.topP)
      .topK(expected.topK)
      .frequencyPenalty(expected.frequencyPenalty)
      .presencePenalty(expected.presencePenalty)
      .seed(expected.seed)
      .stopSequences(expected.stopSequences)
      .maxRetries(expected.maxRetries)
      .abortSignal(expected.abortSignal)
      .maxSteps(expected.maxSteps);

    assertType<typeof expected>(configuredBuilder.options);

    // Generation typings

    // @ts-expect-error Cannot generate text without model and prompt
    void configuredBuilder.generateText();
    // @ts-expect-error Cannot stream text without model and prompt
    void configuredBuilder.streamText();
    // @ts-expect-error Cannot generate object without model and prompt
    void configuredBuilder.generateObject();
    // @ts-expect-error Cannot stream object without model and prompt
    void configuredBuilder.streamObject();

    const withMessages = configuredBuilder
      .model(new MockLanguageModelV1({}))
      .messages([]);

    const object = await withMessages.generateObject({
      schema: z.object({
        a: z.string(),
        b: z.number(),
      }),
    });
    assertType<{ a: string; b: number }>(object.object);

    const stream = withMessages.streamObject({
      schema: z.object({
        a: z.string(),
        b: z.number(),
      }),
    });
    assertType<Partial<{ a: string; b: number }>>(await stream.object);

    const text = await withMessages.generateText();
    assertType<string>(text.text);
    assertType<Array<never>>(text.toolCalls);

    const streamText = await withMessages.streamText();
    assertType<string>(await streamText.text);
    assertType<Array<never>>(await streamText.toolCalls);

    // Tools typings

    const withTools = withMessages.tools({
      myTool: tool({
        parameters: z.object({
          a: z.string(),
        }),
      }),
    });

    // @ts-expect-error Tool is not in the tools
    withTools.activeTools([""]);

    withTools.activeTools(["myTool"]);

    withTools.toolChoice({
      // @ts-expect-error Tool is not in the tools
      toolName: "plop",
      type: "tool",
    });

    withTools.toolChoice({
      toolName: "myTool",
      type: "tool",
    });

    const textWithTools = await withTools.generateText();
    assertType<
      Array<{
        type: "tool-call";
        toolCallId: string;
        toolName: "myTool";
        args: {
          a: string;
        };
      }>
    >(textWithTools.toolCalls);
  };

  describe("generateText", () => {
    it("generates text", async () => {
      const builder = completion
        .model(
          new MockLanguageModelV1({
            doGenerate: () =>
              Promise.resolve({
                rawCall: { rawPrompt: null, rawSettings: {} },
                finishReason: "stop",
                usage: { promptTokens: 10, completionTokens: 20 },
                text: `Hello, world!`,
              }),
          }),
        )
        .messages(await Promise.all([userMsg`Hello, world!`]));
      const res = await builder.generateText();
      assert.equal(res.text, "Hello, world!");
    });
  });
});
