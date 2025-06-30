import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod/v4";
import { queryApply, queryPredicate, querySchema } from "./query.lib.ts";

describe("queryPredicate", () => {
  it("creates a query config with correct structure", () => {
    const query = queryPredicate(
      "testQuery",
      z.string(),
      (param) => (input: { value: string }) => input.value === param,
    );

    assert.equal(query.name, "testQuery");
    assert.ok(query.schema);
    assert.ok(query.handler);
  });

  it("validates schema correctly", () => {
    const query = queryPredicate(
      "testQuery",
      z.number(),
      (param) => () => param > 0,
    );

    const parsed = query.schema.parse({ testQuery: 42 });
    assert.deepEqual(parsed, { testQuery: 42 });

    assert.throws(() => {
      query.schema.parse({ testQuery: "not a number" });
    });
  });

  it("handler returns a function that evaluates input", () => {
    const query = queryPredicate(
      "contains",
      z.string(),
      (param) => (input: { text: string }) => input.text.includes(param),
    );

    const handler = query.handler("test");
    assert.equal(handler({ text: "this is a test" }), true);
    assert.equal(handler({ text: "this is not" }), false);
  });
});

describe("querySchema", () => {
  it("creates schema with base functions", () => {
    const schema = querySchema([]);

    const andQuery = schema.parse({
      and: [{ always: true }, { always: true }],
    });
    assert.deepEqual(andQuery, { and: [{ always: true }, { always: true }] });

    const orQuery = schema.parse({ or: [{ always: true }, { always: true }] });
    assert.deepEqual(orQuery, { or: [{ always: true }, { always: true }] });

    const alwaysQuery = schema.parse({ always: true });
    assert.deepEqual(alwaysQuery, { always: true });

    const neverQuery = schema.parse({ never: true });
    assert.deepEqual(neverQuery, { never: true });
  });

  it("supports nested queries", () => {
    const schema = querySchema([]);

    const nestedQuery = schema.safeParse({
      and: [
        { or: [{ always: true }, { never: true }] },
        { not: { always: true } },
      ],
    });

    assert.ok(nestedQuery.success);
    assert.deepEqual(nestedQuery.data, {
      and: [
        { or: [{ always: true }, { never: true }] },
        { not: { always: true } },
      ],
    });
  });

  it("includes extra schemas", () => {
    const extraSchema = z.object({ custom: z.string() });
    const schema = querySchema([extraSchema]);

    const customQuery = schema.parse({ custom: "value" });
    assert.deepEqual(customQuery, { custom: "value" });
  });

  it("rejects invalid queries", () => {
    const schema = querySchema([]);

    assert.throws(() => {
      schema.parse({ $invalid: true });
    });

    assert.throws(() => {
      schema.parse({ always: false });
    });
  });
});

describe("queryApply", () => {
  // Define the combined input type that satisfies all configs
  type TestInput = { value: string; number: number };

  const testConfig = [
    queryPredicate(
      "equals",
      z.string(),
      (param) => (input: TestInput) => input.value === param,
    ),
    queryPredicate(
      "greaterThan",
      z.number(),
      (param) => (input: TestInput) => input.number > param,
    ),
  ];

  describe("base functions", () => {
    it("handles always", () => {
      const result = queryApply(
        testConfig,
        { always: true },
        { value: "any", number: 0 },
      );
      assert.equal(result, true);
    });

    it("handles never", () => {
      const result = queryApply(
        testConfig,
        { never: true },
        { value: "any", number: 0 },
      );
      assert.equal(result, false);
    });

    it("handles and with all true", () => {
      const result = queryApply(
        testConfig,
        {
          and: [{ equals: "test" }, { always: true }],
        },
        { value: "test", number: 0 },
      );
      assert.equal(result, true);
    });

    it("handles and with one false", () => {
      const result = queryApply(
        testConfig,
        {
          and: [{ equals: "test" }, { never: true }],
        },
        { value: "test", number: 0 },
      );
      assert.equal(result, false);
    });

    it("handles or with at least one true", () => {
      const result = queryApply(
        testConfig,
        {
          or: [{ equals: "wrong" }, { equals: "test" }],
        },
        { value: "test", number: 0 },
      );
      assert.equal(result, true);
    });

    it("handles or with all false", () => {
      const result = queryApply(
        testConfig,
        {
          or: [{ equals: "wrong" }, { never: true }],
        },
        { value: "test", number: 0 },
      );
      assert.equal(result, false);
    });

    it("handles not", () => {
      const resultFalse = queryApply(
        testConfig,
        {
          not: { equals: "test" },
        },
        { value: "test", number: 0 },
      );
      assert.equal(resultFalse, false);

      const resultTrue = queryApply(
        testConfig,
        {
          not: { equals: "wrong" },
        },
        { value: "test", number: 0 },
      );
      assert.equal(resultTrue, true);
    });
  });

  describe("custom functions", () => {
    it("applies custom query functions", () => {
      const resultTrue = queryApply(
        testConfig,
        { equals: "test" },
        { value: "test", number: 0 },
      );
      assert.equal(resultTrue, true);

      const resultFalse = queryApply(
        testConfig,
        { equals: "wrong" },
        { value: "test", number: 0 },
      );
      assert.equal(resultFalse, false);
    });

    it("works with multiple query types", () => {
      const result = queryApply(
        testConfig,
        {
          or: [{ equals: "test" }, { greaterThan: 10 }],
        },
        { value: "test", number: 5 },
      );
      assert.equal(result, true);
    });
  });

  describe("complex queries", () => {
    it("handles deeply nested queries", () => {
      const result = queryApply(
        testConfig,
        {
          and: [
            {
              or: [{ equals: "test" }, { equals: "other" }],
            },
            {
              not: {
                and: [{ greaterThan: 100 }, { never: true }],
              },
            },
          ],
        },
        { value: "test", number: 50 },
      );
      assert.equal(result, true);
    });
  });

  describe("empty config", () => {
    it("works with empty config array and base functions", () => {
      const emptyConfig: [] = [];

      const alwaysResult = queryApply(
        emptyConfig,
        { always: true },
        "any input",
      );
      assert.equal(alwaysResult, true);

      const neverResult = queryApply(
        emptyConfig,
        { never: true },
        { any: "shape" },
      );
      assert.equal(neverResult, false);

      const andResult = queryApply(
        emptyConfig,
        {
          and: [{ always: true }, { always: true }],
        },
        42,
      );
      assert.equal(andResult, true);

      const orResult = queryApply(
        emptyConfig,
        {
          or: [{ never: true }, { always: true }],
        },
        null,
      );
      assert.equal(orResult, true);

      const notResult = queryApply(
        emptyConfig,
        {
          not: { never: true },
        },
        undefined,
      );
      assert.equal(notResult, true);
    });
  });

  describe("edge cases", () => {
    it("returns false for undefined query", () => {
      const result = queryApply(testConfig, undefined, {
        value: "test",
        number: 0,
      });
      assert.equal(result, false);
    });
  });
});
