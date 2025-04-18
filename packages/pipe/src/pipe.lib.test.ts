import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pipe, Pipeable } from "./pipe.lib.ts";

class Test extends Pipeable<Test, number> {
  private readonly _value: number;
  public constructor(_value: number) {
    super();
    this._value = _value;
  }

  public valueOf(): number {
    return this._value;
  }

  public instanceOf(): Test {
    return this;
  }

  public add(value: number): Test {
    return new Test(this._value + value);
  }

  public powerOf2(): Test2 {
    return new Test2(this._value * this._value);
  }
}

class Test2 extends Pipeable<Test2, number> {
  private readonly _value: number;
  public constructor(value: number) {
    super();
    this._value = value;
  }

  public valueOf(): number {
    return this._value;
  }

  public instanceOf(): Test2 {
    return this;
  }

  public minus(value: number): Test2 {
    return new Test2(this._value - value);
  }
}

describe("pipe", () => {
  describe("primitive", () => {
    it("works with strings", () => {
      const value = pipe("")._((v) => v + "!").$;
      assert.equal(value, "!");
    });
    it("works with numbers", () => {
      const value = pipe(1)._((v) => v + 1).$;
      assert.equal(value, 2);
    });
    it("works with null", () => {
      const value = pipe(null)._((v) => v).$;
      assert.equal(value, null);
    });
    it("works with undefined", () => {
      const value = pipe(undefined)._((v) => v).$;
      assert.equal(value, undefined);
    });
    it("works with booleans", () => {
      const value = pipe(true)._((v) => v).$;
      assert.equal(value, true);
    });
    it("works with symbols", () => {
      const symbol = Symbol("test");
      const value = pipe(symbol)._((v) => v).$;
      assert.equal(value, symbol);
    });
  });
  describe("object", () => {
    it("extends objects to allow chaining", () => {
      const value = pipe({ a: 1 })
        ._((v) => v.a)
        ._((v) => v + 2).$;
      assert.equal(value, 3);
    });
  });
  describe("pipeable", () => {
    it("chains through class methods", () => {
      const value = pipe(new Test(2)).powerOf2().minus(1).$;
      assert.equal(value, 3);
    });

    it("chains through valueOf", () => {
      const value = pipe(new Test(1))._$((v) => v + 1).$;
      assert.equal(value, 2);
    });
  });
  describe("promises", () => {
    void it.skip("allows chaining promises", async () => {
      // @ts-expect-error For future implementation
      const value = pipe(Promise.resolve(1))._((v) => v + 1).$;
      assert.equal(value instanceof Promise, true);
      assert.equal(await value, 2);
    });

    void it.skip("skips on catch", () => {
      // @ts-expect-error For future implementation
      const value = pipe(Promise.reject(new Error("test")))._((v) => v + 1).$;
      assert.equal(value, undefined);
    });
  });
  describe("iterable", () => {
    void it.skip("iterates over an array", () => {
      const value = pipe([1, 2, 3])
        // @ts-expect-error For future implementation
        .map((v) => v + 1)
        .append([5, 6])
        .toArray().$;
      assert.deepEqual(value, [2, 3, 4, 5, 6]);
    });
  });
});
