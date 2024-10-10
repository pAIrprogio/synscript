import Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { CompletionBuilder } from "../completion.builder";
import { userMsg } from "../message.builder";
import { AnthropicRunner } from "./anthropic.runner";

const MODEL = "claude-3-5-sonnet-20240620";
type AnthropicCreate = () => Promise<Anthropic.Message>;
const mockAnthropicResponse =
  (config: {
    content: Anthropic.Messages.Message["content"];
    stopReason: Anthropic.Messages.Message["stop_reason"];
    stopSequence?: Anthropic.Messages.Message["stop_sequence"];
  }) =>
  () =>
    Promise.resolve({
      id: "123",
      model: "claude-3-5-sonnet-20240620",
      stop_reason: config.stopReason,
      content: config.content,
      type: "message",
      role: "assistant",
      stop_sequence: config.stopSequence ?? null,
      usage: {
        input_tokens: 10,
        output_tokens: 12,
      },
    } satisfies Anthropic.Message);

const completion = CompletionBuilder.new
  .system("Hello World")
  .temperature(0.5)
  .maxTokens(100)
  .addMessages([userMsg`Hello`]);

describe("AnthropicRunner", () => {
  describe("runChatCompletion", () => {
    it("runs the completion", async () => {
      const mockClient = {
        messages: {
          create: mock.fn(
            mockAnthropicResponse({
              content: [{ type: "text", text: "Hi yall" }],
              stopReason: "end_turn",
            }),
          ),
        },
      } as any as Anthropic;

      const newCompletion = await AnthropicRunner.new()
        .client(mockClient)
        .model(MODEL)
        .runChatCompletion(completion);

      assert.equal(newCompletion.$.messages.length, 2);
      assert.deepEqual(newCompletion.$.messages[1], {
        role: "assistant",
        content: [{ type: "text", text: "Hi yall" }],
      });
    });

    it("continues the completion", async (ctx) => {
      const mockCreate = ctx.mock.fn<AnthropicCreate>(
        mockAnthropicResponse({
          content: [{ type: "text", text: "yall" }],
          stopReason: "end_turn",
        }),
      );
      mockCreate.mock.mockImplementationOnce(
        mockAnthropicResponse({
          content: [{ type: "text", text: "Hi " }],
          stopReason: "max_tokens",
        }),
      );
      const mockClient = {
        messages: {
          create: mockCreate,
        },
      } as any as Anthropic;

      const newCompletion = await AnthropicRunner.new()
        .client(mockClient)
        .model(MODEL)
        .continues(1)
        .runChatCompletion(completion);

      assert.equal(newCompletion.$.messages.length, 2);
      assert.deepEqual(newCompletion.$.messages[1], {
        role: "assistant",
        content: [
          { type: "text", text: "Hi " },
          { type: "text", text: "yall" },
        ],
      });
    });

    it("includes the stop sequence in the last message", async (ctx) => {
      const mockCreate = ctx.mock.fn<AnthropicCreate>(
        mockAnthropicResponse({
          content: [{ type: "text", text: "Hi yall" }],
          stopReason: "stop_sequence",
          stopSequence: "!",
        }),
      );
      const mockClient = {
        messages: {
          create: mockCreate,
        },
      } as any as Anthropic;

      const newCompletion = await AnthropicRunner.new()
        .client(mockClient)
        .model(MODEL)
        .continues(1)
        .runChatCompletion(completion);

      assert.equal(newCompletion.$.messages.length, 2);
      assert.deepEqual(newCompletion.$.messages[1], {
        role: "assistant",
        content: [{ type: "text", text: "Hi yall!" }],
      });
    });
  });
});
