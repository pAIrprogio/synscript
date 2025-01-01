import { MockLanguageModelV1 } from "ai/test";
import { describe } from "node:test";
import { z } from "zod";
import { assertType } from "../../../shared/src/ts.utils.ts";
import { completion, CompletionBuilder } from "./completion.builder.ts";

describe("CompletionBuilder", () => {
  const _typesTesting = async () => {
    // Assert base completion
    const builder = completion;
    assertType<{}>(builder.$);

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
    } satisfies CompletionBuilder.Options.Partial;

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
    assertType<typeof expected>(configuredBuilder.$);

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
  };
});
