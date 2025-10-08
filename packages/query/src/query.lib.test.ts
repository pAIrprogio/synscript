import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod/v4";
import { queryPredicate, querySchema } from "./query.lib.ts";

describe("queryPredicate", () => {
  it("creates a query config with correct structure", () => {
    const query = queryPredicate({
      name: "testQuery",
      configSchema: z.string(),
      handler: (param) => (input: { value: string }) => input.value === param,
      key: () => "testKey",
    });

    assert.equal(query.name, "testQuery");
    assert.ok(query.configSchema);
    assert.ok(query.handler);
    assert.ok(query.key);
  });

  it("validates schema correctly", () => {
    const query = queryPredicate({
      name: "testQuery",
      configSchema: z.number(),
      handler: (param) => (input: { value: number }) => param > input.value,
      key: () => "testKey",
    });

    const parsed = query.configSchema.parse({ testQuery: 42 });
    assert.deepEqual(parsed, { testQuery: 42 });
  });

  it("handler returns a function that evaluates input", () => {
    const query = queryPredicate({
      name: "contains",
      configSchema: z.string(),
      handler: (param) => (input: { text: string }) =>
        input.text.includes(param),
    });

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
