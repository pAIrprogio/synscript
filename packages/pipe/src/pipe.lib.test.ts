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

class PromiseTest<TValue extends number | Promise<number>> extends Pipeable<
  PromiseTest<TValue>,
  TValue
> {
  private readonly _value: TValue;

  public constructor(value: TValue) {
    super();
    this._value = value;
  }

  public add(value: number) {
    return new PromiseTest(this._$((v) => v + value).$);
  }

  public addAsync(value: number) {
    return new PromiseTest(this._$((v) => Promise.resolve(v + value)).$);
  }

  public valueOf(): TValue {
    return this._value;
  }

  public instanceOf() {
    return this;
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
  describe("tap", () => {
    it("can tap into the value", (t) => {
      const fn = t.mock.fn();
      const value = pipe(new Test(1)).tap((v) => fn(v.$)).$;
      assert.equal(value, 1);
      assert.equal(fn.mock.callCount(), 1);
    });
  });
  describe("promises", () => {
    it("chains promises", async () => {
      // @ts-expect-error For future implementation
      const value = pipe(Promise.resolve(1))._((v) => v + 1).$;
      assert.equal(value instanceof Promise, true);
      assert.equal(await value, 2);
    });

    it("skips failed promises", async () => {
      const value = pipe(Promise.reject(new Error("test")))._(() => {
        throw new Error("Should not throw");
        return 1;
      }).$;
      assert.equal(value instanceof Promise, true);
      await assert.rejects(value, Error, "test");
    });

    it("works with valueOf chaining", async () => {
      const value = new PromiseTest(1)
        .addAsync(1)
        .add(1)
        ._((v) => v.add(1)).$;
      assert.equal(value instanceof Promise, true);
      assert.equal(await value, 3);
    });
  });
});
