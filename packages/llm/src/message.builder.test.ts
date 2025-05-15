import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assistantMsgWithOptions,
  systemMsgWithOptions,
  userMsg,
  userMsgWithOptions,
} from "./message.builder.ts";
import { filePart } from "./part.builder.ts";

describe("MessageBuilder", () => {
  /**
   * As the user function is a subclass of the base class
   * we use it to test the base class
   */
  describe("base tests", () => {
    it("allows a call with a template string", () => {
      const message = userMsg`Hello World`;
      assert.deepEqual(message, {
        role: "user",
        content: [{ type: "text", text: "Hello World" }],
        providerOptions: undefined,
      });
    });

    it("ignores null and undefined values", () => {
      const msg = userMsg`${null}${undefined}`;
      assert.deepEqual(msg, {
        role: "user",
        content: [],
        providerOptions: undefined,
      });
    });
  });

  describe("user", () => {
    it("allows interleaving images and text", async () => {
      const message = await userMsg`
          Hello ${filePart.fromPath("./src/test_files/dino.png")} World`;
      assert.equal(message.role, "user");
      assert.equal(message.content.length, 3);
      assert.deepEqual(message.content[0], {
        type: "text",
        text: "Hello ",
      });
      assert.deepEqual(message.content[1].type, "image");
      assert.deepEqual(message.content[2], {
        type: "text",
        text: " World",
      });
    });
  });

  describe("userMsgWithOptions", () => {
    it("creates a user message with provider options", () => {
      const userMsgCustom = userMsgWithOptions({
        providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
      });

      const message = userMsgCustom`Hello World`;

      assert.deepEqual(message, {
        role: "user",
        content: [{ type: "text", text: "Hello World" }],
        providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
      });
    });
  });

  describe("assistantMsgWithOptions", () => {
    it("creates an assistant message with provider options", () => {
      const assistantMsgCustom = assistantMsgWithOptions({
        providerOptions: { openai: { cacheControl: { type: "ephemeral" } } },
      });

      const message = assistantMsgCustom`Hello World`;

      assert.deepEqual(message, {
        role: "assistant",
        content: [{ type: "text", text: "Hello World" }],
        providerOptions: { openai: { cacheControl: { type: "ephemeral" } } },
      });
    });
  });

  describe("systemMsgWithOptions", () => {
    it("creates a system message with provider options", () => {
      const systemMsgCustom = systemMsgWithOptions({
        providerOptions: { anthropic: { system_prompt_behavior: "default" } },
      });

      const message = systemMsgCustom`Hello World`;

      assert.deepEqual(message, {
        role: "system",
        content: "Hello World",
        providerOptions: { anthropic: { system_prompt_behavior: "default" } },
      });
    });
  });
});
