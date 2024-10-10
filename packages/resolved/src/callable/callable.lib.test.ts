import { assertExtends } from "@shared/ts.utils";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Callable, CallableResolvable, resolveNested } from "./callable.lib";

// As never extends true, check never assertions by puting them after

describe("typings", () => {
  describe("Callable", () => {
    assertExtends<"hello", Callable.Infer<() => "hello">>();
    assertExtends<"hello", Callable.Infer<"hello">>();
    assertExtends<Callable.IsPromise<() => "hello">, never>();
    assertExtends<true, Callable.IsPromise<() => Promise<"hello">>>();
  });
  describe("CallableResolvable", () => {
    assertExtends<"hello", CallableResolvable.Infer<"hello">>();
    assertExtends<"hello", CallableResolvable.Infer<() => "hello">>();
    assertExtends<"hello", CallableResolvable.Infer<Promise<"hello">>>();
    assertExtends<"hello", CallableResolvable.Infer<() => Promise<"hello">>>();
    assertExtends<never, CallableResolvable.IsPromise<"hello">>();
    assertExtends<CallableResolvable.IsPromise<Promise<"hello">>, true>();
    assertExtends<never, CallableResolvable.IsPromise<() => "hello">>();
    assertExtends<CallableResolvable.IsPromise<() => Promise<"hello">>, true>();
  });
  describe("CallableResolvable.MaybeArray", () => {
    assertExtends<
      Array<1 | 2 | 3 | 4>,
      CallableResolvable.MaybeArray.Infer<[1, 2, 3, 4]>
    >();
    assertExtends<
      Array<1 | 2 | 3 | 4>,
      CallableResolvable.MaybeArray.Infer<
        [1, () => 2, Promise<3>, () => Promise<4>]
      >
    >();
    assertExtends<
      true,
      CallableResolvable.MaybeArray.IsPromise<[Promise<1>]>
    >();
    assertExtends<
      true,
      CallableResolvable.MaybeArray.IsPromise<[() => Promise<1>]>
    >();
    assertExtends<
      CallableResolvable.MaybeArray.IsPromise<[1, () => 2]>,
      never
    >();

    assertExtends<
      Array<1 | 2>,
      CallableResolvable.MaybeArray.Return<[1, () => 2]>
    >();
    assertExtends<
      CallableResolvable.MaybeArray.Return<[1, () => 2]>,
      Array<1 | 2>
    >();

    assertExtends<
      Promise<Array<1>>,
      CallableResolvable.MaybeArray.Return<[Promise<1>]>
    >();
    assertExtends<
      CallableResolvable.MaybeArray.Return<[Promise<1>]>,
      Promise<Array<1>>
    >();

    assertExtends<
      Promise<Array<1>>,
      CallableResolvable.MaybeArray.Return<[Promise<1>]>
    >();
    assertExtends<
      CallableResolvable.MaybeArray.Return<[Promise<1>]>,
      Promise<Array<1>>
    >();
  });
  describe("CallableResolvable.MaybeArray.ArrayOf", () => {
    assertExtends<
      Array<1 | 2 | 3 | 4>,
      CallableResolvable.MaybeArray.ArrayOf.Infer<[1, 2, 3, 4]>
    >();
    assertExtends<
      Array<1 | 2 | 3 | 4>,
      CallableResolvable.MaybeArray.ArrayOf.Infer<
        [1, () => 2, Promise<3>, () => Promise<4>]
      >
    >();
    assertExtends<
      Promise<Array<Array<1>>>,
      CallableResolvable.MaybeArray.ArrayOf.Return<[[() => Promise<1>]]>
    >();
  });
});

describe("resolveNested", () => {
  it("resolves a sync value", () => {
    const value = resolveNested([1, () => 2, [3, () => 4]]);
    assert.deepEqual(value, [1, 2, [3, 4]]);
  });
  it("resolves an async value", async () => {
    const value = resolveNested([
      1,
      () => 2,
      [3, (): number => 4],
      Promise.resolve(1),
      () => Promise.resolve(2),
      [Promise.resolve(3), () => Promise.resolve(4)],
    ]);
    assert.equal(value instanceof Promise, true);
    assert.deepEqual(await value, [1, 2, [3, 4], 1, 2, [3, 4]]);
  });
});
