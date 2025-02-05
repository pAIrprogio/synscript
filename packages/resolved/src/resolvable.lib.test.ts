import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertExtends, assertType } from "../../shared/src/ts.utils.ts";
import { type Resolvable, pipe, resolveNested } from "./resolvable.lib.ts";

// As never extends true, check never assertions by puting them after

describe("typings", () => {
  describe("Resolvable", () => {
    assertExtends<"hello", Resolvable.Infer<"hello">>();
    assertExtends<"hello", Resolvable.Infer<Promise<"hello">>>();
    assertExtends<Resolvable.IsPromise<"hello">, never>();
    assertExtends<true, Resolvable.IsPromise<Promise<"hello">>>();
    assertExtends<string, Resolvable.Infer<string>>();
    assertExtends<Array<1 | 2>, Resolvable.ArrayOf.Infer<[1, 2]>>();
    assertExtends<Array<1 | 2>, Resolvable.ArrayOf.Infer<[1, Promise<2>]>>();
    assertExtends<Resolvable.ArrayOf.HasPromise<[1, 2]>, never>();
    assertExtends<true, Resolvable.ArrayOf.HasPromise<[1, Promise<2>]>>();
  });
});

describe("Resolver", () => {
  describe("Resolver.pipe", () => {
    it("pipes a sync value", () => {
      const value = pipe("Not a promise")._((v) => v.toUpperCase()).$;
      assert.equal(value, "NOT A PROMISE");
    });

    it("pipes an async value", async () => {
      const value: Promise<string> = pipe(Promise.resolve("Not a promise"))._(
        (v) => v.toUpperCase(),
      ).$;
      assert.equal(value instanceof Promise, true);
      assert.equal(await value, "NOT A PROMISE");
    });

    it("pipes a sync value to an async function", async () => {
      const value: Promise<string> = pipe("Not a promise")
        ._((_v) => Promise.resolve("Hello"))
        ._((v) => v.toUpperCase()).$;
      assert.equal(value instanceof Promise, true);
      assert.equal(await value, "HELLO");
    });

    it("pipes array values", () => {
      const value = pipe(["Not a promise"])._((v) =>
        v.map((v) => v.toUpperCase()),
      ).$;
      assert.deepEqual(value, ["NOT A PROMISE"]);
    });

    it("pipes resolved array values", async () => {
      const value = pipe([Promise.resolve("Not a promise")])._((v) =>
        v.map((v) => v.toUpperCase()),
      ).$;
      assert.equal(value instanceof Promise, true);
      assert.deepEqual(await value, ["NOT A PROMISE"]);
    });

    it("pipes an array of sync values to an async function", async () => {
      const value: Promise<Array<string>> = pipe(["a", "b"])
        ._((v) => v.map((v) => Promise.resolve(v)))
        ._((v) => v.map((v) => v.toUpperCase())).$;
      assert.equal(value instanceof Promise, true);
      assert.deepEqual(await value, ["A", "B"]);
    });

    it("resolves an array of async values to a single promise", async () => {
      const value: Promise<Array<string>> = pipe([
        "Not a promise",
        Promise.resolve("Not a promise"),
      ]).$;
      assert.equal(value instanceof Promise, true);
      assert.deepEqual(await value, ["Not a promise", "Not a promise"]);
    });
  });
  describe("resolveNested", () => {
    it("resolves an empty array", () => {
      const value = resolveNested([]);
      assertType<Array<never>>(value);
      assert.deepEqual(value, []);
    });

    it("resolves an array of sync values", () => {
      const value = resolveNested(["a", "b"]);
      assertType<Array<string>>(value);
      assert.deepEqual(value, ["a", "b"]);
    });

    it("resolves an array of promises", async () => {
      const value = resolveNested([Promise.resolve("a"), Promise.resolve("b")]);
      assertType<Promise<Array<string>>>(value);
      assert.equal(value instanceof Promise, true);
      assert.deepEqual(await value, ["a", "b"]);
    });

    it("resolves an array of arrays", () => {
      const value = resolveNested([
        ["a", "b"],
        ["c", "d"],
      ]);
      assertType<Array<Array<string>>>(value);
      assert.deepEqual(value, [
        ["a", "b"],
        ["c", "d"],
      ]);
    });

    it("resolves an array of arrays of promises", async () => {
      const value = resolveNested([
        [Promise.resolve("a"), Promise.resolve("b")],
        [Promise.resolve("c"), Promise.resolve("d")],
      ]);
      assertType<Promise<Array<Array<string>>>>(value);
      assert.equal(value instanceof Promise, true);
      assert.deepEqual(await value, [
        ["a", "b"],
        ["c", "d"],
      ]);
    });
  });
});
