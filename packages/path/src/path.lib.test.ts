import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ensureFileExtension } from "./path.lib.ts";

describe("ensureFileExtension", () => {
  it("adds extension when missing", () => {
    const result = ensureFileExtension("/path/to/file", ".txt");
    assert.equal(result, "/path/to/file.txt");
  });

  it("does not duplicate existing extension", () => {
    const result = ensureFileExtension("/path/to/file.txt", ".txt");
    assert.equal(result, "/path/to/file.txt");
  });

  it("supports extension without leading dot", () => {
    const result = ensureFileExtension("/path/to/file", "txt");
    assert.equal(result, "/path/to/file.txt");
  });
});
