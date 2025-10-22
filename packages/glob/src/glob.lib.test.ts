import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { capture, matches } from "./glob.lib.ts";

describe("glob capture", () => {
  it("captures globs", () => {
    assert.deepEqual(capture("**/(*)/(*).ts", "path/to/file.ts"), [
      "to",
      "file",
    ]);
  });
  it("returns null if glob does not match", () => {
    assert.deepEqual(
      capture("**/never/(*)/(*).ts", "path/to/sub/file.ts"),
      null,
    );
  });
});

describe("glob matches", () => {
  describe("with forward slashes", () => {
    it("matches simple patterns", () => {
      assert.equal(matches("path/to/file.ts", "**/*.ts"), true);
      assert.equal(matches("path/to/file.js", "**/*.ts"), false);
    });

    it("matches nested paths", () => {
      assert.equal(matches("src/components/Button.tsx", "**/*.tsx"), true);
      assert.equal(matches("src/components/Button.tsx", "src/**/*.tsx"), true);
    });

    it("handles exclusions", () => {
      assert.equal(matches("path/to/file.ts", ["**/*.ts", "!**/node_modules/**"]), true);
      assert.equal(matches("node_modules/pkg/file.ts", ["**/*.ts", "!**/node_modules/**"]), false);
    });
  });

  describe("with Windows backslashes", () => {
    it("matches simple patterns with backslashes", () => {
      assert.equal(matches("path\\to\\file.ts", "**/*.ts"), true);
      assert.equal(matches("path\\to\\file.js", "**/*.ts"), false);
    });

    it("matches nested paths with backslashes", () => {
      assert.equal(matches("src\\components\\Button.tsx", "**/*.tsx"), true);
      assert.equal(matches("src\\components\\Button.tsx", "src/**/*.tsx"), true);
    });

    it("handles exclusions with backslashes", () => {
      assert.equal(matches("path\\to\\file.ts", ["**/*.ts", "!**/node_modules/**"]), true);
      assert.equal(matches("node_modules\\pkg\\file.ts", ["**/*.ts", "!**/node_modules/**"]), false);
    });

    it("matches mixed separators", () => {
      assert.equal(matches("path\\to/file.ts", "**/*.ts"), true);
      assert.equal(matches("path/to\\file.ts", "path/**/*.ts"), true);
    });
  });
});
