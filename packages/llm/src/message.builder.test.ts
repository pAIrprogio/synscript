import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertType } from "../../shared/src/ts.utils.ts";
import type { Llm } from "./llm.types.ts";
import { userMsg } from "./message.builder.ts";
import { filePart } from "./part.builder.ts";

const _typings = () => {
  assertType<Llm.Message.User>(userMsg``);
  assertType<Promise<Llm.Message.User>>(userMsg`${Promise.resolve("Value")}`);
};

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
      });
    });

    it("ignores null and undefined values", () => {
      const msg = userMsg`${null}${undefined}`;
      assert.deepEqual(msg, {
        role: "user",
        content: [],
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
});
