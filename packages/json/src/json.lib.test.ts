import { assertType } from "@shared/ts.utils";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";
import * as json from "./json.lib";

describe("Json", () => {
  describe("deserialize", () => {
    it("deserializes an object", () => {
      const data = json.deserialize<{ a: string }>('{"a": "Hello World"}');
      assert.deepEqual(data, { a: "Hello World" });
    });
    it("deserializes with validation", () => {
      const data = json.deserialize<{ a: string }>('{"a": "Hello World"}', {
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
