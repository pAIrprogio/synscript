import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { userMsg } from "./message.builder.ts";
import { messagePart } from "./part.builder.ts";

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
          Hello ${messagePart.fromFile("./src/test_files/dino.png")} World`;
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
