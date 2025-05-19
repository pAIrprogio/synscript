import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { enhance } from "./enhance.lib.ts";

describe("enhance", () => {
  it("enhances objects with custom methods", () => {
    const base = { value: 1 };
    const enhanced = enhance("numbers", base, {
      double: function () {
        return this.value * 2;
      },
      add: function (n: number) {
        return this.value + n;
      },
    });

    assert.equal(enhanced.double(), 2);
    assert.equal(enhanced.add(3), 4);
    assert.strictEqual(enhanced.$(), base);
  });

  it("does not mutate the original object when enhanced again", () => {
    const base = { value: 1 };
    const first = enhance("numbers", base, {
      inc: function () {
        return this.value + 1;
      },
    });

    const second = enhance("numbers", first, {
      double: function () {
        return this.value * 2;
      },
    });

    assert.equal(typeof (first as any).double, "undefined");
    assert.deepEqual(base, { value: 1 });
    assert.equal(first.inc(), 2);
    assert.equal(second.double(), 2);
    assert.strictEqual(first.$(), base);
    assert.strictEqual(second.$().$(), base);
  });
});
