import assert from "node:assert/strict";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { ensureFileExtension, isInPath } from "./path.lib.ts";

describe("ensureFileExtension", () => {
  it("adds extension when missing", () => {
    const result = ensureFileExtension("/path/to/file", ".txt");
    assert.equal(result, resolve("/path/to/file.txt"));
  });

  it("does not duplicate existing extension", () => {
    const result = ensureFileExtension("/path/to/file.txt", ".txt");
    assert.equal(result, resolve("/path/to/file.txt"));
  });

  it("supports extension without leading dot", () => {
    const result = ensureFileExtension("/path/to/file", "txt");
    assert.equal(result, resolve("/path/to/file.txt"));
  });
});

describe("isInPath", () => {
  it("returns true when path is inside base path", () => {
    const result = isInPath("/base", "/base/subdir");
    assert.equal(result, true);
  });

  it("returns true when path is deeply nested inside base path", () => {
    const result = isInPath("/base", "/base/sub/dir/file.txt");
    assert.equal(result, true);
  });

  it("returns false when path is outside base path", () => {
    const result = isInPath("/base", "/other");
    assert.equal(result, false);
  });

  it("returns false when path is the same as base path", () => {
    const result = isInPath("/base", "/base");
    assert.equal(result, false);
  });

  it("returns false when path has similar prefix but different directory", () => {
    const result = isInPath("/base/dir", "/base/directory");
    assert.equal(result, false);
  });

  it("handles relative paths by resolving them first", () => {
    const result = isInPath(".", "subdir");
    assert.equal(result, true);
  });

  it("returns false when using parent directory navigation", () => {
    const result = isInPath("/base/sub", "/base/sub/../other");
    assert.equal(result, false);
  });
});
