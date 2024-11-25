import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deepEqual } from "./equality.utils.ts";

describe("deepEqual", () => {
  it("returns true for identical primitive values", () => {
    assert.equal(deepEqual(1, 1), true);
    assert.equal(deepEqual("test", "test"), true);
    assert.equal(deepEqual(true, true), true);
    assert.equal(deepEqual(null, null), true);
    assert.equal(deepEqual(undefined, undefined), true);
  });

  it("returns true when undefined matches a non existing key", () => {
    assert.equal(deepEqual({ a: undefined }, {}), true);
    assert.equal(deepEqual({ a: undefined }, { a: 1 }), false);
  });

  it("returns false for different primitive values", () => {
    assert.equal(deepEqual(1, 2), false);
    assert.equal(deepEqual("test", "test2"), false);
    assert.equal(deepEqual(true, false), false);
    assert.equal(deepEqual(null, undefined), false);
  });

  it("returns true for identical objects", () => {
    assert.equal(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 }), true);
    assert.equal(deepEqual({ a: { b: 1 } }, { a: { b: 1 } }), true);
  });

  it("returns true for objects with same attributes ordered differently", () => {
    assert.equal(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
  });

  it("returns false for objects with different values", () => {
    assert.equal(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 }), false);
    assert.equal(deepEqual({ a: { b: 1 } }, { a: { b: 2 } }), false);
  });

  it("returns false for objects with different keys", () => {
    assert.equal(deepEqual({ a: 1, b: 2 }, { a: 1, c: 2 }), false);
  });

  it("returns true for identical arrays", () => {
    assert.equal(deepEqual([1, 2, 3], [1, 2, 3]), true);
    assert.equal(deepEqual([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }]), true);
  });

  it("returns false for arrays with different values", () => {
    assert.equal(deepEqual([1, 2, 3], [1, 2, 4]), false);
    assert.equal(deepEqual([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 3 }]), false);
  });

  it("returns false for arrays with different lengths", () => {
    assert.equal(deepEqual([1, 2, 3], [1, 2]), false);
  });

  it("should handle mixed nested structures", () => {
    assert.equal(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }), true);
    assert.equal(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] }), false);
  });
});
