import { assertExtends, assertType } from "@shared/src/ts.utils";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";
import { AnthropicRunner } from "./anthropic/anthropic.runner";
import { CompletionBuilder } from "./completion.builder";
import { CompletionRunner } from "./completion.runner";
import { Llm } from "./llm.types";

describe("CompletionBuilder", () => {
  const _types = () => {};

  it("can be created", () => {
    const completion = CompletionBuilder.new;
    const res = completion.$;

    type ExpectedType = {};
    assertExtends<typeof res, ExpectedType>();
    assertExtends<ExpectedType, typeof res>();
    assert.deepEqual(res, {});

    const _typeTest = () => {
      const runner = {} as any as AnthropicRunner.Instance.Ready;
      // @ts-expect-error anthropic conversion should not be available in this state
      void completion.run(runner);
    };
  });

  it("add informations", () => {
    const userMessage = {
      role: "user" as const,
      content: [{ type: "text" as const, text: "Hello World" }],
    };
    const assistantMessage = {
      role: "assistant" as const,
      content: [{ type: "text" as const, text: "Hello World" }],
    };

    const testTool = {
      name: "test",
      schema: z.object({ name: z.string() }),
    };

    const completion = CompletionBuilder.new
      .system("Hello World")
      .temperature(8)
      .maxTokens(4000)
      .topK(10)
      .topP(0.5)
      .stopSequences(["\n"])
      .addMessages([userMessage])
      .addMessages([assistantMessage])
      .tools([testTool], true);

    const res = completion.$;

    type ExpectedType = {
      messages: Array<Llm.Message>;
      system: string;
      temperature: number;
      maxTokens: number;
      toolsConfig: Llm.Completion.Tool.Multi;
      topK: number;
      topP: number;
      stopSequences: string[];
    };

    assertType<ExpectedType>(res);

    const _typeTest = () => {
      const runner = {} as any as CompletionRunner<Llm.Completion>;
      // Anthropic conversion should be available in this state
      void completion.run(runner);
    };

    assert.deepEqual(res, {
      system: "Hello World",
      temperature: 8,
      maxTokens: 4000,
      toolsConfig: {
        type: "multi",
        tools: [testTool],
        requireToolUse: true,
      },
      topK: 10,
      topP: 0.5,
      stopSequences: ["\n"],
      messages: [userMessage, assistantMessage],
    });
  });

  it("can be created from an existing completion", () => {
    const completion = CompletionBuilder.from({
      system: "Hello World",
      temperature: 8,
      maxTokens: 4000,
      topK: 10,
      topP: 0.5,
      stopSequences: ["\n"],
      messages: [
        {
          role: "user" as const,
          content: [{ type: "text" as const, text: "Hello World" }],
        },
        {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello World" }],
        },
      ],
    });

    const res = completion.$;

    type ExpectedType = {
      messages: Array<Llm.Message>;
      system: string;
      temperature: number;
      maxTokens: number;
      topK: number;
      topP: number;
      stopSequences: string[];
    };

    assertType<ExpectedType>(res);

    const _typeTest = () => {
      const runner = {} as any as CompletionRunner<Llm.Completion>;
      // Anthropic conversion should be available in this state
      void completion.run(runner);
    };

    assert.deepEqual(res, {
      system: "Hello World",
      temperature: 8,
      maxTokens: 4000,
      topK: 10,
      topP: 0.5,
      stopSequences: ["\n"],
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "Hello World" }],
        },
        {
          role: "assistant",
          content: [{ type: "text", text: "Hello World" }],
        },
      ],
    });
  });
});
