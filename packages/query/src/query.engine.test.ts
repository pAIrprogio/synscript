import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod/v4";
import { QueryEngine } from "./query.engine.ts";

describe("QueryEngine", () => {
  describe("Creation and Initialization", () => {
    it("creates a default QueryEngine with no predicates", () => {
      const engine = QueryEngine.default();

      // Verify the schema only accepts base predicates
      const schema = engine.schema;

      // Test base predicates work
      assert.doesNotThrow(() => schema.parse({ always: true }));
      assert.doesNotThrow(() => schema.parse({ never: true }));
      assert.doesNotThrow(() =>
        schema.parse({ and: [{ always: true }, { never: true }] }),
      );
      assert.doesNotThrow(() =>
        schema.parse({ or: [{ always: true }, { never: true }] }),
      );
      assert.doesNotThrow(() => schema.parse({ not: { always: true } }));

      // Test unknown predicates are rejected
      assert.throws(() => schema.parse({ unknownPredicate: "value" }));
    });

    it("creates a QueryEngine with a single predicate using static method", () => {
      const engine = QueryEngine.addPredicate({
        name: "contains",
        configSchema: z.string(),
        handler: (substring) => (input: { text: string }) =>
          input.text.includes(substring),
      });

      const schema = engine.schema;

      // Test custom predicate works
      assert.doesNotThrow(() => schema.parse({ contains: "test" }));

      // Test base predicates still work
      assert.doesNotThrow(() => schema.parse({ always: true }));
      assert.doesNotThrow(() =>
        schema.parse({ and: [{ contains: "test" }, { always: true }] }),
      );

      // Test wrong type for predicate parameter
      assert.throws(() => schema.parse({ contains: 123 }));
    });

    it("adds multiple predicates to an existing QueryEngine", () => {
      const engine = QueryEngine.addPredicate({
        name: "contains",
        configSchema: z.string(),
        handler: (substring) => (input: { text: string }) =>
          input.text.includes(substring),
      })
        .addPredicate({
          name: "startsWith",
          configSchema: z.string(),
          handler: (prefix) => (input: { text: string }) =>
            input.text.startsWith(prefix),
        })
        .addPredicate({
          name: "endsWith",
          configSchema: z.string(),
          handler: (suffix) => (input: { text: string }) =>
            input.text.endsWith(suffix),
        });

      const schema = engine.schema;

      // Test all custom predicates work
      assert.doesNotThrow(() => schema.parse({ contains: "test" }));
      assert.doesNotThrow(() => schema.parse({ startsWith: "test" }));
      assert.doesNotThrow(() => schema.parse({ endsWith: "test" }));

      // Test combining predicates
      assert.doesNotThrow(() =>
        schema.parse({
          and: [
            { startsWith: "hello" },
            { endsWith: "world" },
            { contains: "o wo" },
          ],
        }),
      );
    });
  });

  describe("Schema Generation and Validation", () => {
    it("generates schema for empty engine that only validates base predicates", () => {
      const engine = QueryEngine.default<{ value: string }>();
      const schema = engine.schema;

      // Valid base predicates
      const validQueries = [
        { always: true },
        { never: true },
        { and: [{ always: true }, { never: true }] },
        { or: [{ always: true }, { never: true }] },
        { not: { always: true } },
        {
          and: [
            { or: [{ always: true }, { never: true }] },
            { not: { never: true } },
          ],
        },
      ];

      for (const query of validQueries) {
        assert.doesNotThrow(() => schema.parse(query));
      }

      // Invalid queries
      assert.throws(() => schema.parse({ equals: "test" }));
      assert.throws(() => schema.parse({ unknown: true }));
    });

    it("generates schema for engine with custom predicates", () => {
      type TestInput = { value: string; number: number };
      const engine = QueryEngine.addPredicate({
        name: "equals",
        configSchema: z.string(),
        handler: (value) => (input: TestInput) => input.value === value,
      }).addPredicate({
        name: "greaterThan",
        configSchema: z.number(),
        handler: (threshold) => (input: TestInput) => input.number > threshold,
      });

      const schema = engine.schema;

      // Test custom predicates
      assert.doesNotThrow(() => schema.parse({ equals: "test" }));
      assert.doesNotThrow(() => schema.parse({ greaterThan: 42 }));

      // Test nested queries
      assert.doesNotThrow(() =>
        schema.parse({
          and: [{ equals: "test" }, { greaterThan: 10 }],
        }),
      );

      assert.doesNotThrow(() =>
        schema.parse({
          or: [{ not: { equals: "wrong" } }, { greaterThan: 100 }],
        }),
      );

      // Test unknown predicates are rejected
      assert.throws(() => schema.parse({ unknownPredicate: "value" }));
      assert.throws(() => schema.parse({ equals: 123 })); // Wrong type
      assert.throws(() => schema.parse({ greaterThan: "not a number" })); // Wrong type
    });

    it("generates JSON schema", () => {
      type TestInput = { value: string; number: number };
      const engine = QueryEngine.addPredicate({
        name: "equals",
        configSchema: z.string(),
        handler: (value) => (input: TestInput) => input.value === value,
      }).addPredicate({
        name: "greaterThan",
        configSchema: z.number(),
        handler: (threshold) => (input: TestInput) => input.number > threshold,
      });

      const jsonSchema = engine.jsonSchema;

      // Verify it's a valid object (basic check)
      assert.ok(typeof jsonSchema === "object");
      assert.ok(jsonSchema !== null);

      // Should have anyOf since it's a union
      assert.ok("anyOf" in jsonSchema);
      assert.ok(Array.isArray(jsonSchema.anyOf));
    });
  });

  describe("Query Application", () => {
    // Define test input type and predicates
    type TestInput = { value: string; number: number; text: string };

    const createTestEngine = () =>
      QueryEngine.addPredicate({
        name: "equals",
        configSchema: z.string(),
        handler: (value) => (input: TestInput) => input.value === value,
      })
        .addPredicate({
          name: "greaterThan",
          configSchema: z.number(),
          handler: (threshold) => (input: TestInput) =>
            input.number > threshold,
        })
        .addPredicate({
          name: "contains",
          configSchema: z.string(),
          handler: (substring) => (input: TestInput) =>
            input.text.includes(substring),
        })
        .addPredicate({
          name: "matches",
          configSchema: z.string(),
          handler: (pattern) => (input: TestInput) =>
            new RegExp(pattern).test(input.text),
        });

    it("applies simple predicate queries", () => {
      const engine = createTestEngine();
      const input: TestInput = { value: "test", number: 42, text: "testing" };

      // Test equals predicate
      assert.equal(engine.match({ equals: "test" }, input), true);
      assert.equal(engine.match({ equals: "other" }, input), false);

      // Test greaterThan predicate
      assert.equal(engine.match({ greaterThan: 40 }, input), true);
      assert.equal(engine.match({ greaterThan: 50 }, input), false);

      // Test contains predicate
      assert.equal(engine.match({ contains: "test" }, input), true);
      assert.equal(engine.match({ contains: "xyz" }, input), false);

      // Test matches predicate
      assert.equal(engine.match({ matches: "^test" }, input), true);
      assert.equal(engine.match({ matches: "^xyz" }, input), false);
    });

    it("applies 'always' query", () => {
      const engine = createTestEngine();
      const input: TestInput = { value: "any", number: 0, text: "any" };

      assert.equal(engine.match({ always: true }, input), true);
    });

    it("applies 'never' query", () => {
      const engine = createTestEngine();
      const input: TestInput = { value: "any", number: 0, text: "any" };

      assert.equal(engine.match({ never: true }, input), false);
    });

    it("applies 'and' queries", () => {
      const engine = createTestEngine();
      const input: TestInput = { value: "test", number: 42, text: "testing" };

      // All conditions true
      assert.equal(
        engine.match(
          {
            and: [{ equals: "test" }, { greaterThan: 40 }],
          },
          input,
        ),
        true,
      );

      // One condition false
      assert.equal(
        engine.match(
          {
            and: [{ equals: "test" }, { greaterThan: 50 }],
          },
          input,
        ),
        false,
      );

      // And array requires at least 2 elements
      assert.throws(() => engine.match({ and: [] }, input));
    });

    it("applies 'or' queries", () => {
      const engine = createTestEngine();
      const input: TestInput = { value: "test", number: 42, text: "testing" };

      // At least one condition true
      assert.equal(
        engine.match(
          {
            or: [{ equals: "wrong" }, { greaterThan: 40 }],
          },
          input,
        ),
        true,
      );

      // All conditions false
      assert.equal(
        engine.match(
          {
            or: [{ equals: "wrong" }, { greaterThan: 50 }],
          },
          input,
        ),
        false,
      );

      // Or array requires at least 2 elements
      assert.throws(() => engine.match({ or: [] }, input));
    });

    it("applies 'not' queries", () => {
      const engine = createTestEngine();
      const input: TestInput = { value: "test", number: 42, text: "testing" };

      assert.equal(engine.match({ not: { equals: "test" } }, input), false);
      assert.equal(engine.match({ not: { equals: "other" } }, input), true);
      assert.equal(engine.match({ not: { greaterThan: 50 } }, input), true);
      assert.equal(engine.match({ not: { greaterThan: 30 } }, input), false);
    });

    it("applies deeply nested queries", () => {
      const engine = createTestEngine();
      const input: TestInput = { value: "test", number: 42, text: "testing" };

      const complexQuery = {
        and: [
          {
            or: [{ equals: "test" }, { equals: "other" }],
          },
          {
            not: {
              and: [{ greaterThan: 100 }, { contains: "xyz" }],
            },
          },
        ],
      };

      assert.equal(engine.match(complexQuery, input), true);

      // Another complex query that should be false
      const falseQuery = {
        or: [
          {
            and: [{ equals: "wrong" }, { greaterThan: 30 }],
          },
          {
            and: [{ contains: "xyz" }, { not: { never: true } }],
          },
        ],
      };

      assert.equal(engine.match(falseQuery, input), false);
    });

    it("works with empty predicate array and base functions", () => {
      const engine = QueryEngine.default<string>();

      const alwaysResult = engine.match({ always: true }, "any input");
      assert.equal(alwaysResult, true);

      const neverResult = engine.match({ never: true }, "any input");
      assert.equal(neverResult, false);

      const andResult = engine.match(
        {
          and: [{ always: true }, { always: true }],
        },
        "any input",
      );
      assert.equal(andResult, true);

      const orResult = engine.match(
        {
          or: [{ never: true }, { always: true }],
        },
        "any input",
      );
      assert.equal(orResult, true);

      const notResult = engine.match(
        {
          not: { never: true },
        },
        "any input",
      );
      assert.equal(notResult, true);
    });
  });

  describe("Query Validation", () => {
    type TestInput = { value: string; number: number };
    const engine = QueryEngine.addPredicate({
      name: "equals",
      configSchema: z.string(),
      handler: (value) => (input: TestInput) => input.value === value,
    }).addPredicate({
      name: "greaterThan",
      configSchema: z.number(),
      handler: (threshold) => (input: TestInput) => input.number > threshold,
    });

    it("validates queries before execution", () => {
      const input: TestInput = { value: "test", number: 42 };

      // Valid query passes
      assert.doesNotThrow(() => engine.match({ equals: "test" }, input));

      // Invalid query structure throws
      assert.throws(() => engine.match({ unknownPredicate: "value" }, input));

      // Invalid parameter type throws
      assert.throws(() => engine.match({ greaterThan: "not a number" }, input));
    });

    it("skips validation when option is set", () => {
      const input: TestInput = { value: "test", number: 42 };

      // Invalid query that would normally throw
      const invalidQuery = { unknownPredicate: "value" };

      // Should not throw with skip validation
      assert.doesNotThrow(() =>
        engine.match(invalidQuery, input, { skipQueryValidation: true }),
      );

      // Returns false because predicate doesn't exist
      assert.equal(
        engine.match(invalidQuery, input, { skipQueryValidation: true }),
        false,
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles undefined query", () => {
      const engine = QueryEngine.addPredicate({
        name: "test",
        configSchema: z.string(),
        handler: () => () => true,
      });

      assert.equal(engine.match(undefined, { any: "input" }), false);
    });

    it("validates and/or arrays require at least 2 elements", () => {
      const engine = QueryEngine.default<{ any: string }>();
      const input = { any: "input" };

      // Schema validation fails for empty arrays
      assert.throws(() => engine.match({ and: [] }, input));
      assert.throws(() => engine.match({ or: [] }, input));

      // Valid arrays with 2+ elements work
      assert.doesNotThrow(() =>
        engine.match({ and: [{ always: true }, { always: true }] }, input),
      );
      assert.doesNotThrow(() =>
        engine.match({ or: [{ always: true }, { never: true }] }, input),
      );
    });

    it("handles predicates with same input type", () => {
      type SharedInput = { text: string; count: number };

      const engine = QueryEngine.addPredicate({
        name: "textContains",
        configSchema: z.string(),
        handler: (substring) => (input: SharedInput) =>
          input.text.includes(substring),
      })
        .addPredicate({
          name: "textStartsWith",
          configSchema: z.string(),
          handler: (prefix) => (input: SharedInput) =>
            input.text.startsWith(prefix),
        })
        .addPredicate({
          name: "countEquals",
          configSchema: z.number(),
          handler: (value) => (input: SharedInput) => input.count === value,
        })
        .addPredicate({
          name: "countGreaterThan",
          configSchema: z.number(),
          handler: (threshold) => (input: SharedInput) =>
            input.count > threshold,
        });

      const input: SharedInput = { text: "hello world", count: 42 };

      // All predicates work with the same input
      assert.equal(engine.match({ textContains: "world" }, input), true);
      assert.equal(engine.match({ textStartsWith: "hello" }, input), true);
      assert.equal(engine.match({ countEquals: 42 }, input), true);
      assert.equal(engine.match({ countGreaterThan: 40 }, input), true);

      // Complex query with multiple predicates
      assert.equal(
        engine.match(
          {
            and: [{ textContains: "world" }, { countGreaterThan: 40 }],
          },
          input,
        ),
        true,
      );
    });

    it("provides correct type inference", () => {
      const _engine = QueryEngine.addPredicate({
        name: "test",
        configSchema: z.string(),
        handler: (value) => (input: { data: string }) => input.data === value,
      });

      // Type tests (compile-time only, runtime assertion for coverage)
      type InferredQuery = QueryEngine.InferQuery<typeof _engine>;
      type InferredInput = QueryEngine.InferInput<typeof _engine>;

      // These would fail at compile time if types were wrong
      const validQuery: InferredQuery = { test: "value" };
      const validInput: InferredInput = { data: "value" };

      assert.ok(validQuery);
      assert.ok(validInput);
    });
  });

  describe("Chaining and Immutability", () => {
    it("returns new instance when adding predicates", () => {
      const engine1 = QueryEngine.default<{ value: string }>();
      const engine2 = engine1.addPredicate({
        name: "equals",
        configSchema: z.string(),
        handler: (value) => (input: { value: string }) => input.value === value,
      });
      const engine3 = engine2.addPredicate({
        name: "contains",
        configSchema: z.string(),
        handler: (substring) => (input: { value: string }) =>
          input.value.includes(substring),
      });

      // All engines are different instances
      assert.notEqual(engine1, engine2);
      assert.notEqual(engine2, engine3);
      assert.notEqual(engine1, engine3);

      // Original engine schema doesn't have custom predicates
      assert.throws(() => engine1.schema.parse({ equals: "test" }));

      // Second engine has first predicate but not second
      assert.doesNotThrow(() => engine2.schema.parse({ equals: "test" }));
      assert.throws(() => engine2.schema.parse({ contains: "test" }));

      // Third engine has both predicates
      assert.doesNotThrow(() => engine3.schema.parse({ equals: "test" }));
      assert.doesNotThrow(() => engine3.schema.parse({ contains: "test" }));
    });

    it("supports method chaining", () => {
      const engine = QueryEngine.addPredicate({
        name: "p1",
        configSchema: z.string(),
        handler: () => () => true,
      })
        .addPredicate({
          name: "p2",
          configSchema: z.number(),
          handler: () => () => true,
        })
        .addPredicate({
          name: "p3",
          configSchema: z.boolean(),
          handler: () => () => true,
        });

      const schema = engine.schema;

      // All predicates are available
      assert.doesNotThrow(() => schema.parse({ p1: "test" }));
      assert.doesNotThrow(() => schema.parse({ p2: 123 }));
      assert.doesNotThrow(() => schema.parse({ p3: true }));

      // Can combine them
      assert.doesNotThrow(() =>
        schema.parse({
          and: [{ p1: "test" }, { p2: 123 }, { p3: true }],
        }),
      );
    });
  });

  describe("Query Caching", () => {
    it("caches predicate results when useCache is enabled", () => {
      const engine = QueryEngine.addPredicate({
        name: "test",
        configSchema: z.boolean(),
        handler: (value: boolean) => () => value,
        cacheKey: () => "key",
      });

      // Cache the value for true
      engine.match({ test: true }, undefined, { useCache: true });
      // Should return true because the value is cached
      assert.equal(
        engine.match({ test: false }, undefined, { useCache: true }),
        true,
      );
    });

    it("does not use cache when useCache is disabled", () => {
      const engine = QueryEngine.addPredicate({
        name: "test",
        configSchema: z.boolean(),
        handler: (value: boolean) => () => value,
        cacheKey: () => "key",
      });

      // Cache the value for true
      engine.match({ test: true }, undefined, { useCache: true });
      // Should return false because we don't use the cache
      assert.equal(
        engine.match({ test: false }, undefined, { useCache: false }),
        false,
      );
    });

    it("does not cache when predicate has no key function", () => {
      const engine = QueryEngine.addPredicate({
        name: "test",
        configSchema: z.boolean(),
        handler: (value: boolean) => () => value,
      });

      engine.match({ test: true }, undefined, { useCache: true });
      assert.equal(
        engine.match({ test: false }, undefined, { useCache: true }),
        false,
      );
    });
  });
});
