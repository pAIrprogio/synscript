import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";
import { assertType } from "../../shared/src/ts.utils.ts";
import * as json from "./json.lib.ts";

describe("Json", () => {
  describe("deserialize", () => {
    it("deserializes an object", () => {
      const data = json.deserialize<{ a: string }>('{"a": "Hello World"}');
      assert.deepEqual(data, { a: "Hello World" });
    });
    it("deserializes with validation", () => {
      const data = json.deserialize('{"a": "Hello World"}', {
        schema: z.object({ a: z.string() }),
      });
      assertType<{ a: string }>(data);
      assert.deepEqual(data, { a: "Hello World" });
    });
    it("throws an error on invalid schema", () => {
      assert.throws(() => {
        json.deserialize('{"a": "Hello World"}', {
          schema: z.object({ a: z.number() }),
        });
      });
    });
  });
});
