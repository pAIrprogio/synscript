import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertExtends, assertType } from "../../shared/src/ts.utils.ts";
import { Text, tIf } from "./text.lib.ts";

const _types = () => {
  assertExtends<{ type: "1" }, Text.ExtraObject.Infer<[() => { type: "1" }]>>();
  assertExtends<
    | { type: "1" }
    | { type: "2" }
    | { type: "3" }
    | { type: "4" }
    | { type: "5" },
    Text.ExtraObject.Infer<
      [
        [() => { type: "1" }, { type: "2" }, () => Promise<{ type: "3" }>],
        { type: "4" },
        () => Promise<{ type: "5" }>,
      ]
    >
  >();
};

describe("t", () => {
  it("removes extra newlines", () => {
    const text = Text.t`
        1


        2
        3

        4
      `;
    assert.equal(text, "1\n\n2\n3\n\n4");
  });

  it("cleans up the text", () => {
    const text = Text.t`
      # ${"hi"} job
  
      ${() => "hello\n\nworld"}
  
      ${() => "hello\n\nworld"}
    `;
    assert.equal(text, "# hi job\n\nhello\n\nworld\n\nhello\n\nworld");
  });

  it("can insert strings", () => {
    const text = Text.t`Hello ${"World"}`;
    assert.equal(text, "Hello World");
  });

  it("can insert promises", async () => {
    const text = Text.t`Hello ${Promise.resolve("World")}`;
    assert.equal(text instanceof Promise, true);
    assert.equal(await text, "Hello World");
  });

  it("can insert multiple strings", () => {
    const text = Text.t`Hello ${"World"} ${"Universe"}`;
    assert.equal(text, "Hello World Universe");
  });

  it("preserves nested indentation", () => {
    const inline = "Hello\nWorld";
    const text = Text.t`$\n  ${inline}`;
    assert.equal(text, "$\n  Hello\n  World");
  });

  it("ignores null, undefined, and false values", () => {
    const text = Text.t`Hello ${null} ${undefined} ${false} hi`;
    assert.equal(text, "Hello    hi");
  });

  it("handles functions", async () => {
    const text = Text.t`Hello ${() => Promise.resolve("World")}`;
    assert.equal(text instanceof Promise, true);
    assert.equal(await text, "Hello World");
  });

  it("Handles complex strings", () => {
    const insideText = () => Text.t`
              - Value 1
              - Value 2
            `;

    const text = Text.t`
              Hello
                ${insideText}
            `;

    const expected = `
Hello
  - Value 1
  - Value 2
        `.trim();

    assert.equal(text, expected);
  });

  it("allows extra objects", () => {
    const text: string & { __extra: { type: "extra" } } =
      Text.t`Hello ${{ type: "extra" as const }} World`;
    assert.equal(text, 'Hello %STR_EXTRA%{"type":"extra"}%!STR_EXTRA% World');
  });

  it("excludes undefined, null, and false values from arrays", () => {
    const text = Text.t`Hello ${[undefined, null, false, "World"]}`;
    assert.equal(text, "Hello World");
  });

  it("allows string arrays", () => {
    const text = Text.t`
                Test
                  ${["Hello", "World", { type: "extra" as const }]}
                `;

    type ExpectedType = string & { __extra: { type: "extra" } };
    assertExtends<ExpectedType, typeof text>();

    assert.equal(
      text,
      `Test\n  Hello\n  World\n  %STR_EXTRA%{"type":"extra"}%!STR_EXTRA%`,
    );
  });
});

describe("split", () => {
  it("splits the text", () => {
    const text = Text.t`Hello ${{ type: "extra" as const }} World`;
    const split = Text.parse(text);

    type ExpectedType = Array<string | { type: "extra" }>;

    assertExtends<ExpectedType, typeof split>();
    assertExtends<typeof split, ExpectedType>();

    assert.deepEqual(split, ["Hello ", { type: "extra" }, " World"]);
  });

  it("excludes empty strings", () => {
    const text = Text.t`${{ type: "extra" as const }}${{ type: "extra" as const }}`;
    const split = Text.parse(text);

    type ExpectedType = Array<string | { type: "extra" }>;

    assertExtends<ExpectedType, typeof split>();
    assertExtends<typeof split, ExpectedType>();

    assert.deepEqual(split, [{ type: "extra" }, { type: "extra" }]);
  });
});

describe("tIf", () => {
  it("returns the text if the condition is truthy", () => {
    const text = tIf(5)`Hello World`;
    assertType<string, typeof text>(text);
    assert.equal(text, "Hello World");
  });

  it("returns an empty string if the condition is falsy", () => {
    const text = tIf(undefined)`Hello World`;
    assertType<string, typeof text>(text);
    assert.equal(text, "");
  });

  it("returns a string promise if the condition is a truthy promise", async () => {
    const text = tIf(Promise.resolve(true))`Hello World`;
    assertType<Promise<string>, typeof text>(text);
    assert.equal(text instanceof Promise, true);
    assert.equal(await text, "Hello World");
  });

  it("returns an empty string promise if the condition is a falsy promise", async () => {
    const text = tIf(Promise.resolve(false))`Hello World`;
    assertType<Promise<string>, typeof text>(text);
    assert.equal(text instanceof Promise, true);
    assert.equal(await text, "");
  });
});
