import { fsDir, fsFile } from "@synstack/fs";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPatternName } from "./markdown-patterns.lib.ts";

describe("getPatternName()", () => {
  it("returns the pattern name from directory and file", () => {
    const mockDir = fsDir("/base/patterns");
    const mockFile = fsFile("/base/patterns/ember/template/uses/buttons.md");

    const expected = { name: "ember/template/uses/buttons", type: null };
    assert.deepEqual(getPatternName(mockDir, mockFile), expected);
  });
  it("skips the file name if it's the same as the last folder", () => {
    const mockDir = fsDir("/base/patterns");
    const mockFile = fsFile(
      "/base/patterns/ember/template/uses/buttons/buttons",
    );

    const expected = { name: "ember/template/uses/buttons", type: null };
    assert.deepEqual(getPatternName(mockDir, mockFile), expected);
  });
  it("returns removes the prefix", () => {
    const mockDir = fsDir("/base/patterns");
    const mockFile = fsFile(
      "/base/patterns/ember/template/uses/buttons/0.buttons.md",
    );

    const expected = { name: "ember/template/uses/buttons", type: null };
    assert.deepEqual(getPatternName(mockDir, mockFile), expected);
  });
  it("returns the type", () => {
    const mockDir = fsDir("/base/patterns");
    const mockFile = fsFile(
      "/base/patterns/ember/template/uses/buttons/0.buttons.my-type.md",
    );

    const expected = { name: "ember/template/uses/buttons", type: "my-type" };
    assert.deepEqual(getPatternName(mockDir, mockFile), expected);
  });
  it("returns the middle part of the file name even if it contains a dot", () => {
    const mockDir = fsDir("/base/patterns");
    const mockFile = fsFile(
      "/base/patterns/ember/template/uses/0.buttons.with.dot.my-type.md",
    );

    const expected = {
      name: "ember/template/uses/buttons.with.dot",
      type: "my-type",
    };
    assert.deepEqual(getPatternName(mockDir, mockFile), expected);
  });
});
