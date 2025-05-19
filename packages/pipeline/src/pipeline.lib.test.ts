import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertType } from "../../shared/src/ts.utils.ts";
import { pipeline } from "./pipeline.lib.ts";

const _types = () => {
  const syncPipeline = pipeline._((a: number) => a + 2)._((a) => a * 2);
  assertType<number>(syncPipeline.apply(1));
  assertType<number>(syncPipeline.$(1));

  const asyncPipeline = pipeline
    ._((a: number) => a + 2)
    ._((a) => Promise.resolve(a * 2));
  assertType<Promise<number>>(asyncPipeline.apply(1));
  assertType<Promise<number>>(asyncPipeline.$(1));
};

describe("pipeline", () => {
  it("chains synchronous functions", () => {
    const p = pipeline._((a: number) => a + 2)._((a) => a * 2);
    assert.equal(p.apply(2), 8);
    assert.equal(p.$(3), 10);
  });

  it("handles async functions", async () => {
    const p = pipeline
      ._((a: number) => a + 2)
      ._((a) => Promise.resolve(a * 2));
    const res = p.apply(2);
    assert.equal(res instanceof Promise, true);
    assert.equal(await res, 8);
  });

  it("mixes async and sync steps", async () => {
    const p = pipeline
      ._((a: number) => Promise.resolve(a + 1))
      ._((b) => b * 3);
    const res = p.$(2);
    assert.equal(res instanceof Promise, true);
    assert.equal(await res, 9);
  });
});
