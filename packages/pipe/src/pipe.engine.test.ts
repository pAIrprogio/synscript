import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";
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

  describe("validate", () => {
    it("validates successful data", () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const pipe = Pipe._((x: any) => x).validate(schema);

      const result = pipe.exec({ name: "John", age: 30 });
      assert.deepEqual(result, { name: "John", age: 30 });
    });

    it("throws PipeValidationException on invalid data", () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const pipe = Pipe._((x: any) => x).validate(schema);

      assert.throws(() => pipe.exec({ name: "John", age: "thirty" }));
    });

    it("validates async data", async () => {
      const schema = z.string();
      const pipe = Pipe._((x: string) =>
        Promise.resolve(x.toUpperCase()),
      ).validate(schema);

      const result = await pipe.exec("hello");
      assert.equal(result, "HELLO");
    });

    it("validates async data and throws on invalid", async () => {
      const schema = z.string();
      const pipe = Pipe._((x: any) => Promise.resolve(x)).validate(schema);

      await assert.rejects(async () => await pipe.exec(123));
    });

    it("validates in chain with transformations", () => {
      const schema = z.number().min(0);
      const pipe = Pipe._((x: string) => parseInt(x))
        .validate(schema)
        ._((x) => x * 2);

      const result = pipe.exec("5");
      assert.equal(result, 10);
    });

    it("validates with multiple validation steps", () => {
      const stringSchema = z.string();
      const numberSchema = z.number().positive();

      const pipe = Pipe._((x: any) => x)
        .validate(stringSchema)
        ._((x) => parseInt(x))
        .validate(numberSchema);

      const result = pipe.exec("42");
      assert.equal(result, 42);

      assert.throws(() => pipe.exec("-5"));
    });

    it("preserves types after validation", () => {
      const schema = z.object({ id: z.number(), name: z.string() });
      const pipe = Pipe._((x: any) => x)
        .validate(schema)
        ._((user) => user.name.toUpperCase()); // TypeScript should know user has name property

      const result = pipe.exec({ id: 1, name: "alice" });
      assert.equal(result, "ALICE");
    });
  });
});
