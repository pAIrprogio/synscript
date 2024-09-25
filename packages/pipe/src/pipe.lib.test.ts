import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertType } from "@shared/src/ts.utils";
import { Pipe, pipe } from "./pipe.lib";

describe("Pipe", () => {
  const _types = () => {
    assertType<string>(pipe("Hello World").$);
    assertType<Pipe<string>>(pipe("Hello World")._((v) => v));
    assertType<string>(pipe("Hello World")._((v) => v).$);
    assertType<Promise<string>>(
      pipe("Hello World")._((v) => Promise.resolve(v)),
    );
  };

  it("runs sync", () => {
    const value = pipe("Hello World")._((val) => val.toUpperCase()).$;
    assert.equal(value, "HELLO WORLD");
  });
  it("switches to async", async () => {
    const value = await pipe("Hello World")
      ._((val) => Promise.resolve(val.toUpperCase()))
      .then((val) => val.toLocaleLowerCase());
    assert.equal(value, "hello world");
  });
});
