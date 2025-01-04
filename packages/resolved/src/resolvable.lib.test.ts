import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertExtends } from "../../shared/src/ts.utils.ts";
import { type Resolvable, pipe } from "./resolvable.lib.ts";

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
});
