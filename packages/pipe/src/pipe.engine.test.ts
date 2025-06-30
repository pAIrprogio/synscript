import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Pipe } from "./pipe.engine.ts";

describe("Pipe", () => {
  describe("basic chaining", () => {
    it("chains synchronous functions", () => {
      const pipe = Pipe._((x: number) => x * 2)._((x) => x + 1);

      const result = pipe.exec(5);
      assert.equal(result, 11);
    });

    it("handles async functions", async () => {
      const pipe = Pipe._((x: number) => Promise.resolve(x * 2))._(
        (x) => x + 1,
      );

      const result = await pipe.exec(5);
      assert.equal(result, 11);
    });

    it("handles mixed sync and async functions", async () => {
      const pipe = Pipe._((x: number) => x * 2)
        ._((x) => Promise.resolve(x + 1))
        ._((x) => x * 3);

      const result = await pipe.exec(5);
      assert.equal(result, 33);
    });

    it("handles single function", () => {
      const pipe = Pipe._<string, string>((x) => x.toUpperCase());

      const result = pipe.exec("hello");
      assert.equal(result, "HELLO");
    });

    it("preserves promise chain with async functions", async () => {
      const pipe = Pipe._((x: number) => Promise.resolve(x * 2))
        ._((x) => Promise.resolve(x + 5))
        ._((x) => x / 2);

      const result = await pipe.exec(10);
      assert.equal(result, 12.5);
    });
  });

  describe("tap", () => {
    it("allows side effects without changing value", () => {
      let sideEffect = 0;
      const pipe = Pipe._((x: number) => x * 2)
        .tap((x) => {
          sideEffect = x;
        })
        ._((x) => x + 1);

      const result = pipe.exec(5);
      assert.equal(result, 11);
      assert.equal(sideEffect, 10);
    });

    it("handles tap with async values", async () => {
      let sideEffect = 0;
      const pipe = Pipe._((x: number) => Promise.resolve(x * 2))
        .tap((x) => {
          sideEffect = x;
        })
        ._((x) => x + 1);

      const result = await pipe.exec(5);
      assert.equal(result, 11);
      assert.equal(sideEffect, 10);
    });

    it("allows multiple taps", () => {
      const effects: number[] = [];
      const pipe = Pipe._((x: number) => x * 2)
        .tap((x) => effects.push(x))
        ._((x) => x + 1)
        .tap((x) => effects.push(x))
        ._((x) => x * 3);

      const result = pipe.exec(5);
      assert.equal(result, 33);
      assert.deepEqual(effects, [10, 11]);
    });

    it("preserves promise chain with tap", async () => {
      let sideEffect = 0;
      const pipe = Pipe._((x: number) => Promise.resolve(x * 2))
        .tap((x) => {
          sideEffect = x;
        })
        ._((x) => Promise.resolve(x + 1));

      const result = await pipe.exec(5);
      assert.equal(result, 11);
      assert.equal(sideEffect, 10);
    });
  });
});
