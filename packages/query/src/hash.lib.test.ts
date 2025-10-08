import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stableHash } from "./hash.lib.ts";

describe("stableHash", () => {
  it("produces stable hashes for objects with different key order", () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { c: 3, a: 1, b: 2 };

    assert.equal(stableHash(obj1), stableHash(obj2));
  });

  it("produces stable hashes for nested objects", () => {
    const obj1 = {
      outer: { b: 2, a: 1 },
      inner: { d: 4, c: 3 },
    };
    const obj2 = {
      inner: { c: 3, d: 4 },
      outer: { a: 1, b: 2 },
    };

    assert.equal(stableHash(obj1), stableHash(obj2));
  });

  it("handles arrays without sorting them", () => {
    const arr1 = [1, 2, 3];
    const arr2 = [3, 2, 1];

    assert.notEqual(stableHash(arr1), stableHash(arr2));
  });

  it("handles primitive values", () => {
    assert.equal(stableHash("test"), JSON.stringify("test"));
    assert.equal(stableHash(42), JSON.stringify(42));
  });
});
