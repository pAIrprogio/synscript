import { fsDir, fsFile } from "@synstack/fs";
import { QueryEngine } from "@synstack/query";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import path from "path";
import { z } from "zod/v4";
import { MarkdownDb } from "./markdown-db.engine.ts";

const currentDirectoryPath =
  import.meta.dirname || path.dirname(import.meta.url.replace("file://", ""));
const testPatternsDir = fsDir(currentDirectoryPath).to(".test/patterns");
const testInvalidPatternsDir = fsDir(currentDirectoryPath).to(
  ".test/invalid-patterns",
);
const testOptionalFrontmatterDir = fsDir(currentDirectoryPath).to(
  ".test/optional-frontmatter",
);

// Simple test input type
type TestInput = {
  content: string;
  extension: string;
};

// Helper to create a test query engine with common predicates
function createTestQueryEngine() {
  return QueryEngine.default<TestInput>()
    .addPredicate({
      name: "contains",
      configSchema: z.string(),
      handler: (param) => (input) => input.content.includes(param),
    })
    .addPredicate({
      name: "hasExtension",
      configSchema: z.array(z.string()),
      handler: (extensions) => (input) => extensions.includes(input.extension),
    });
}

describe("MarkdownDb", () => {
  describe("constructor and factory methods", () => {
    it("creates a MarkdownDb with default query engine using cwd", () => {
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
      }>().addPredicate({
        name: "contains",
        configSchema: z.string(),
        handler: (param) => (input) => input.content.includes(param),
      });

      const engine2 = engine1.setQueryEngine(customQuery);

      assert.notEqual(engine1, engine2);
    });

    it("updates query schema when setting new query engine", () => {
      const customQuery = createTestQueryEngine();

      const engine = MarkdownDb.cwd<TestInput>(testPatternsDir)
        .setQueryEngine(customQuery)
        .setEntrySchema(z.object({ status: z.string() }));

      const input = {
        query: { contains: "test" },
        status: "ok",
      };
      const parsed = engine.schema.parse(input);

      assert.deepEqual(parsed, input);
    });
  });

  describe("setEntrySchema", () => {
    it("returns a new instance with extended config schema", () => {
      const engine1 = MarkdownDb.cwd(testPatternsDir);
      const engine2 = engine1.setEntrySchema(
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
      const engine = MarkdownDb.cwd(testPatternsDir).setEntrySchema(
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

  describe("getAll", () => {
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
        .setEntrySchema(
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

  describe("matchOne", () => {
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

    it("returns results sorted by file path when using matchAny", async () => {
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

    it("does not evaluate child entries when parent entry does not match", async () => {
      const engine = MarkdownDb.cwd<TestInput>(testPatternsDir).setQueryEngine(
        createTestQueryEngine(),
      );

      const input: TestInput = {
        content: "test1 code that would match pattern1",
        extension: "tsx",
      };

      const matching = await engine.matchOne(input);
      const matchingNames = matching.map((p) => p.$id);

      // nested/level1 has query: { never: true } so it should not match
      assert.ok(!matchingNames.includes("nested/level1"));

      // nested/level1/pattern1 has query: { contains: "test1" } which would match the input
      // BUT it should not be evaluated because its parent (nested/level1) did not match
      assert.ok(!matchingNames.includes("nested/level1/pattern1"));

      // simple/basic should still match because it has always: true and no non-matching parents
      assert.ok(matchingNames.includes("simple/basic"));
    });
  });

  describe("schema getters", () => {
    it("returns the correct zod schema", () => {
      const engine = MarkdownDb.cwd(testPatternsDir).setEntrySchema(
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
      const engine = MarkdownDb.cwd(testPatternsDir).setEntrySchema(
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
      const engine = MarkdownDb.cwd(testInvalidPatternsDir);

      await assert.rejects(
        async () => await engine.getAll(),
        /Failed to parse config/,
      );
    });

    it("throws error for missing required config fields", async () => {
      const engine = MarkdownDb.cwd(testInvalidPatternsDir).setEntrySchema(
        z.object({
          status: z.string(),
        }),
      );

      await assert.rejects(
        async () => await engine.getAll(),
        /Failed to parse config/,
      );
    });
  });

  describe("optional query field", () => {
    it("uses default query {never: true} when query field is missing", async () => {
      const engine = MarkdownDb.cwd<TestInput>(
        testOptionalFrontmatterDir,
      ).setQueryEngine(createTestQueryEngine());

      // Create a file without a query field in frontmatter
      const noQueryFile = testOptionalFrontmatterDir.toFile("no-query.md");
      await noQueryFile.write.text(`---
status: ok
---
Content without query field`);

      try {
        const patterns = await engine.getAll();

        assert.equal(patterns.length, 1);
        assert.equal(patterns[0].$id, "no-query");
        assert.deepEqual(patterns[0].query, { never: true });
      } finally {
        if (await noQueryFile.exists()) {
          await noQueryFile.remove();
        }
      }
    });

    it("allows explicit query field to override default", async () => {
      const engine = MarkdownDb.cwd<TestInput>(
        testOptionalFrontmatterDir,
      ).setQueryEngine(createTestQueryEngine());

      // Create a file with explicit query field
      const withQueryFile = testOptionalFrontmatterDir.toFile("with-query.md");
      await withQueryFile.write.text(`---
query:
  always: true
---
Content with query field`);

      try {
        const patterns = await engine.getAll();

        assert.equal(patterns.length, 1);
        assert.equal(patterns[0].$id, "with-query");
        assert.deepEqual(patterns[0].query, { always: true });
      } finally {
        if (await withQueryFile.exists()) {
          await withQueryFile.remove();
        }
      }
    });
  });

  describe("optional frontmatter header", () => {
    it("handles markdown files without frontmatter header", async () => {
      const engine = MarkdownDb.cwd<TestInput>(
        testOptionalFrontmatterDir,
      ).setQueryEngine(createTestQueryEngine());

      // Create a file without any frontmatter
      const noHeaderFile = testOptionalFrontmatterDir.toFile("no-header.md");
      await noHeaderFile.write.text(`# Content Only

This file has no frontmatter header at all.`);

      try {
        const patterns = await engine.getAll();

        assert.equal(patterns.length, 1);
        assert.equal(patterns[0].$id, "no-header");
        assert.deepEqual(patterns[0].query, { never: true });
        assert.ok(patterns[0].$content?.includes("Content Only"));
      } finally {
        if (await noHeaderFile.exists()) {
          await noHeaderFile.remove();
        }
      }
    });

    it("throws specific error when frontmatter is missing but required fields exist in schema", async () => {
      const engine = MarkdownDb.cwd<TestInput>(testOptionalFrontmatterDir)
        .setQueryEngine(createTestQueryEngine())
        .setEntrySchema(
          z.object({
            requiredField: z.string(),
          }),
        );

      // Create a file without frontmatter
      const noHeaderFile = testOptionalFrontmatterDir.toFile(
        "no-header-required.md",
      );
      await noHeaderFile.write.text(`# Content without required frontmatter`);

      try {
        await assert.rejects(
          async () => await engine.getAll(),
          /Expected a frontmatter header but got none/,
        );
      } finally {
        if (await noHeaderFile.exists()) {
          await noHeaderFile.remove();
        }
      }
    });

    it("accepts empty frontmatter header", async () => {
      const engine = MarkdownDb.cwd<TestInput>(
        testOptionalFrontmatterDir,
      ).setQueryEngine(createTestQueryEngine());

      // Create a file with empty frontmatter
      const emptyHeaderFile =
        testOptionalFrontmatterDir.toFile("empty-header.md");
      await emptyHeaderFile.write.text(`---
---
Content with empty frontmatter`);

      try {
        const patterns = await engine.getAll();

        assert.equal(patterns.length, 1);
        assert.equal(patterns[0].$id, "empty-header");
        assert.deepEqual(patterns[0].query, { never: true });
      } finally {
        if (await emptyHeaderFile.exists()) {
          await emptyHeaderFile.remove();
        }
      }
    });
  });

  describe("type inference", () => {
    it("correctly infers config type", () => {
      const _engine = MarkdownDb.cwd(testPatternsDir).setEntrySchema(
        z.object({
          status: z.enum(["blocked", "ok"]),
          priority: z.number().optional(),
        }),
      );

      type InferredConfig = MarkdownDb.Entry.Infer<typeof _engine>;

      const config: InferredConfig = {
        query: { always: true },
        status: "ok",
        priority: 1,
      };

      assert.deepEqual(config.status, "ok");
    });
  });

  describe("isEntryFile", () => {
    it("returns true for files in the cwd that match the glob pattern", () => {
      const engine = MarkdownDb.cwd(testPatternsDir);
      const validFile = testPatternsDir.toFile("simple/basic.md");

      assert.ok(engine.isEntryFile(validFile));
    });

    it("returns true for files passed as string paths", () => {
      const engine = MarkdownDb.cwd(testPatternsDir);
      const validFilePath = testPatternsDir.toFile("simple/basic.md").path;

      assert.ok(engine.isEntryFile(validFilePath));
    });

    it("returns false for files outside the cwd", () => {
      const engine = MarkdownDb.cwd(testPatternsDir);
      const outsideFile = fsDir(currentDirectoryPath).toFile("outside.md");

      assert.ok(!engine.isEntryFile(outsideFile));
    });

    it("returns false for files that don't match the glob pattern", () => {
      const engine = MarkdownDb.cwd(testPatternsDir);
      const nonMarkdownFile = testPatternsDir.toFile("simple/basic.txt");

      assert.ok(!engine.isEntryFile(nonMarkdownFile));
    });

    it("respects custom glob patterns", () => {
      const engine = MarkdownDb.cwd(testPatternsDir).setGlobs("simple/**/*.md");
      const simpleFile = testPatternsDir.toFile("simple/basic.md");
      const nestedFile = testPatternsDir.toFile("nested/level1/pattern1.md");

      assert.ok(engine.isEntryFile(simpleFile));
      assert.ok(!engine.isEntryFile(nestedFile));
    });
  });

  describe("computeEntryId", () => {
    it("returns the pattern name from directory and file", () => {
      const mockDir = fsDir("/base/patterns");
      const mockFile = fsFile("/base/patterns/ember/template/uses/buttons.md");
      const mockEngine = MarkdownDb.cwd(mockDir);

      const expected = { name: "ember/template/uses/buttons", type: null };
      assert.deepEqual(mockEngine.computeEntryId(mockFile), expected);
    });

    it("skips the file name if it's the same as the last folder", () => {
      const mockDir = fsDir("/base/patterns");
      const mockFile = fsFile(
        "/base/patterns/ember/template/uses/buttons/buttons",
      );
      const mockEngine = MarkdownDb.cwd(mockDir);

      const expected = { name: "ember/template/uses/buttons", type: null };
      assert.deepEqual(mockEngine.computeEntryId(mockFile), expected);
    });

    it("removes the prefix", () => {
      const mockDir = fsDir("/base/patterns");
      const mockFile = fsFile(
        "/base/patterns/ember/template/uses/buttons/0.buttons.md",
      );
      const mockEngine = MarkdownDb.cwd(mockDir);

      const expected = { name: "ember/template/uses/buttons", type: null };
      assert.deepEqual(mockEngine.computeEntryId(mockFile), expected);
    });

    it("returns the type", () => {
      const mockDir = fsDir("/base/patterns");
      const mockFile = fsFile(
        "/base/patterns/ember/template/uses/buttons/0.buttons.my-type.md",
      );
      const mockEngine = MarkdownDb.cwd(mockDir);

      const expected = { name: "ember/template/uses/buttons", type: "my-type" };
      assert.deepEqual(mockEngine.computeEntryId(mockFile), expected);
    });

    it("returns the middle part of the file name even if it contains a dot", () => {
      const mockDir = fsDir("/base/patterns");
      const mockFile = fsFile(
        "/base/patterns/ember/template/uses/0.buttons.with.dot.my-type.md",
      );
      const mockEngine = MarkdownDb.cwd(mockDir);

      const expected = {
        name: "ember/template/uses/buttons.with.dot",
        type: "my-type",
      };
      assert.deepEqual(mockEngine.computeEntryId(mockFile), expected);
    });
  });
});
