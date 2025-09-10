import { fsDir } from "@synstack/fs";
import { QueryEngine } from "@synstack/query";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import path from "path";
import { z } from "zod/v4";
import { MarkdownDb } from "./markdown-db.engine.ts";

const currentDirectoryPath =
  import.meta.dirname || path.dirname(import.meta.url.replace("file://", ""));
const testPatternsDir = fsDir(currentDirectoryPath).to(".test/patterns");

// Simple test input type
type TestInput = {
  content: string;
  extension: string;
};

// Helper to create a test query engine with common predicates
function createTestQueryEngine() {
  return QueryEngine.default<TestInput>()
    .addPredicate(
      "contains",
      z.string(),
      (param) => (input) => input.content.includes(param),
    )
    .addPredicate(
      "hasExtension",
      z.array(z.string()),
      (extensions) => (input) => extensions.includes(input.extension),
    );
}

describe("PatternEngine", () => {
  describe("constructor and factory methods", () => {
    it("creates a PatternEngine with default query engine using cwd", () => {
      const engine = MarkdownDb.cwd(testPatternsDir);

      assert.ok(engine);
    });

    it("has a default config schema with query field", () => {
      const engine = MarkdownDb.cwd(testPatternsDir);
      const schema = engine.schema;

      // Verify the schema has a query field
      const parsed = schema.parse({ query: { always: true } });
      assert.deepEqual(parsed, { query: { always: true } });
    });
  });

  describe("setQueryEngine", () => {
    it("returns a new instance with updated query engine", () => {
      const engine1 = MarkdownDb.cwd<TestInput>(testPatternsDir);

      const customQuery = QueryEngine.default<{
        content: string;
      }>().addPredicate(
        "contains",
        z.string(),
        (param) => (input) => input.content.includes(param),
      );

      const engine2 = engine1.setQueryEngine(customQuery);

      assert.notEqual(engine1, engine2);
    });

    it("updates query schema when setting new query engine", () => {
      const customQuery = createTestQueryEngine();

      const engine = MarkdownDb.cwd<TestInput>(testPatternsDir)
        .setQueryEngine(customQuery)
        .setConfigSchema(z.object({ status: z.string() }));

      const input = {
        query: { contains: "test" },
        status: "ok",
      };
      const parsed = engine.schema.parse(input);

      assert.deepEqual(parsed, input);
    });
  });

  describe("setConfigSchema", () => {
    it("returns a new instance with extended config schema", () => {
      const engine1 = MarkdownDb.cwd(testPatternsDir);
      const engine2 = engine1.setConfigSchema(
        z.object({
          status: z
            .enum(["tag", "blocked", "ok", "ignore"])
            .optional()
            .default("ok"),
          priority: z.number().optional(),
        }),
      );

      assert.notEqual(engine1, engine2);

      const input = {
        query: { always: true },
        status: "blocked",
        priority: 1,
      };
      const parsed = engine2.schema.parse(input);

      assert.deepEqual(parsed, input);
    });

    it("applies default values from config schema", () => {
      const engine = MarkdownDb.cwd(testPatternsDir).setConfigSchema(
        z.object({
          status: z
            .enum(["tag", "blocked", "ok", "ignore"])
            .optional()
            .default("ok"),
        }),
      );

      const parsed = engine.schema.parse({
        query: { always: true },
      });

      assert.deepEqual(parsed, {
        query: { always: true },
        status: "ok",
      });
    });
  });

  describe("setGlob", () => {
    it("returns a new instance with custom glob pattern", () => {
      const engine1 = MarkdownDb.cwd(testPatternsDir);
      const engine2 = engine1.setGlobs("simple/**/*.md");

      assert.notEqual(engine1, engine2);
    });

    it("filters patterns using custom glob pattern", async () => {
      const engine = MarkdownDb.cwd<TestInput>(testPatternsDir)
        .setQueryEngine(createTestQueryEngine())
        .setGlobs("simple/**/*.md");

      const patterns = await engine.getAll();
      const patternNames = patterns.map((p) => p.$id);

      // Should only find patterns from the simple directory
      assert.ok(patternNames.includes("simple/basic"));
      assert.ok(!patternNames.some((name) => name.startsWith("nested/")));
      assert.ok(!patternNames.some((name) => name.startsWith("complex/")));
    });
  });

  describe("getPatterns", () => {
    it("loads patterns from markdown files", async () => {
      const engine = MarkdownDb.cwd<TestInput>(testPatternsDir).setQueryEngine(
        createTestQueryEngine(),
      );

      const patterns = await engine.getAll();

      const basicPattern = patterns.find((p) => p.$id === "simple/basic");
      assert.ok(basicPattern);
      assert.deepEqual(basicPattern.query, { always: true });
      assert.deepEqual(
        basicPattern.$content,
        "This is a simple test pattern that always matches.",
      );

      const pattern1 = patterns.find((p) => p.$id === "nested/level1/pattern1");
      assert.ok(pattern1);
      assert.deepEqual(pattern1.query, { contains: "test1" });
    });

    it("handles duplicate folder/file names correctly", async () => {
      const engine = MarkdownDb.cwd<TestInput>(testPatternsDir).setQueryEngine(
        createTestQueryEngine(),
      );
      const patterns = await engine.getAll();

      // The file nested/level1/level1.md should be named "nested/level1"
      const level1Pattern = patterns.find((p) => p.$id === "nested/level1");
      assert.ok(level1Pattern);
      assert.deepEqual(level1Pattern.query, { never: true });
    });

    it("loads patterns with custom config fields", async () => {
      const engine = MarkdownDb.cwd<TestInput>(testPatternsDir)
        .setQueryEngine(createTestQueryEngine())
        .setConfigSchema(
          z.object({
            status: z.string().optional(),
          }),
        );

      const patterns = await engine.getAll();
      const statusPattern = patterns.find(
        (p) => p.$id === "complex/with-status",
      );

      assert.ok(statusPattern);
      assert.deepEqual(statusPattern.status, "blocked");
      assert.deepEqual(statusPattern.query, { contains: "button" });
    });

    it("returns patterns sorted by name", async () => {
      const engine = MarkdownDb.cwd<TestInput>(testPatternsDir).setQueryEngine(
        createTestQueryEngine(),
      );
      const patterns = await engine.getAll();

      const names = patterns.map((p) => p.$id);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));

      assert.deepEqual(names, sortedNames);
    });

    it("handles empty prompt correctly", async () => {
      // Create a pattern with no body content
      const emptyPromptFile = testPatternsDir.toFile("empty-prompt.md");
      await emptyPromptFile.write.text(`---
query:
  always: true
---`);

      try {
        const engine = MarkdownDb.cwd<TestInput>(
          testPatternsDir,
        ).setQueryEngine(createTestQueryEngine());
        const patterns = await engine.getAll();

        const emptyPromptPattern = patterns.find(
          (p) => p.$id === "empty-prompt" || p.$id === "/empty-prompt",
        );
        assert.ok(emptyPromptPattern);
        assert.deepEqual(emptyPromptPattern.$content, null);
      } finally {
        // Always clean up
        if (await emptyPromptFile.exists()) {
          await emptyPromptFile.remove();
        }
      }
    });
  });

  describe("matchingPatterns", () => {
    it("filters patterns based on query evaluation", async () => {
      const engine = MarkdownDb.cwd<TestInput>(testPatternsDir).setQueryEngine(
        createTestQueryEngine(),
      );

      const input: TestInput = {
        content: "test1 component code",
        extension: "tsx",
      };

      const matching = await engine.matchOne(input);
      const matchingNames = matching.map((p) => p.$id);

      // Should match: simple/basic (always: true), complex/with-query (contains "component")
      // Should not match: nested/level1 (never: true), nested/level1/pattern1 (parent has never: true)
      const expectedMatches = ["simple/basic", "complex/with-query"];

      assert.deepEqual(matchingNames.sort(), expectedMatches.sort());
    });

    it("uses query engine to evaluate patterns", async () => {
      const engine = MarkdownDb.cwd<TestInput>(testPatternsDir).setQueryEngine(
        createTestQueryEngine(),
      );

      const input: TestInput = {
        content: "test1 code",
        extension: "tsx",
      };

      const matching = await engine.matchOne(input);
      const names = matching.map((p) => p.$id);

      // Should match patterns based on query evaluation
      const expectedMatches = [
        "simple/basic", // always: true
        // nested/level1/pattern1 won't match because parent has never: true
      ];

      const actualSubset = names.filter((name) =>
        expectedMatches.includes(name),
      );
      assert.deepEqual(actualSubset.sort(), expectedMatches.sort());
    });

    it("returns results sorted by file path when using matchAll", async () => {
      const engine = MarkdownDb.cwd<TestInput>(testPatternsDir).setQueryEngine(
        createTestQueryEngine(),
      );

      const inputs: TestInput[] = [
        { content: "test", extension: "tsx" },
        { content: "component", extension: "tsx" },
      ];

      const results = await engine.matchAny(inputs);
      const resultIds = results.map((result) => result.$id);

      // Verify results are returned in sorted order by file path
      // Based on the test patterns, we expect these entries to match and be sorted
      const expectedIds = ["complex/with-query", "simple/basic"];
      assert.deepEqual(resultIds, expectedIds);
    });
  });

  describe("schema getters", () => {
    it("returns the correct zod schema", () => {
      const engine = MarkdownDb.cwd(testPatternsDir).setConfigSchema(
        z.object({
          status: z.string(),
          priority: z.number(),
        }),
      );

      const schema = engine.schema;

      // Test parsing valid data
      const validData = {
        query: { always: true },
        status: "ok",
        priority: 1,
      };

      const parsed = schema.parse(validData);
      assert.deepEqual(parsed, validData);

      // Test parsing invalid data
      assert.throws(() => {
        schema.parse({
          query: { always: true },
          status: "ok",
          // Missing required priority
        });
      });
    });

    it("generates valid JSON schema", () => {
      const engine = MarkdownDb.cwd(testPatternsDir).setConfigSchema(
        z.object({
          status: z.enum(["blocked", "ok"]),
        }),
      );

      const jsonSchema = engine.jsonSchema;

      assert.deepEqual(jsonSchema.type, "object");
      assert.ok(jsonSchema.properties);
      assert.ok(jsonSchema.properties.query);
      assert.ok(jsonSchema.properties.status);

      const statusSchema = jsonSchema.properties.status as any;
      assert.deepEqual(statusSchema.enum, ["blocked", "ok"]);
    });
  });

  describe("error handling", () => {
    it("throws error for invalid pattern config", async () => {
      // Create an invalid pattern file
      const invalidFile = testPatternsDir.toFile("invalid.md");
      await invalidFile.write.text(`---
query:
  invalid_predicate: true
---

Invalid pattern.`);

      const engine = MarkdownDb.cwd(testPatternsDir);

      await assert.rejects(
        async () => await engine.getAll(),
        /Failed to parse config/,
      );

      // Clean up
      await invalidFile.remove();
    });

    it("throws error for missing required config fields", async () => {
      // Create a pattern missing required field
      const missingFieldFile = testPatternsDir.toFile("missing-field.md");
      await missingFieldFile.write.text(`---
status: "ok"
---

Missing query field.`);

      const engine = MarkdownDb.cwd(testPatternsDir).setConfigSchema(
        z.object({
          status: z.string(),
        }),
      );

      await assert.rejects(
        async () => await engine.getAll(),
        /Failed to parse config/,
      );

      // Clean up
      await missingFieldFile.remove();
    });
  });

  describe("type inference", () => {
    it("correctly infers config type", () => {
      const engine = MarkdownDb.cwd(testPatternsDir).setConfigSchema(
        z.object({
          status: z.enum(["blocked", "ok"]),
          priority: z.number().optional(),
        }),
      );

      type InferredConfig = MarkdownDb.Config.Infer<typeof engine>;

      const config: InferredConfig = {
        query: { always: true },
        status: "ok",
        priority: 1,
      };

      assert.deepEqual(config.status, "ok");
    });
  });
});
