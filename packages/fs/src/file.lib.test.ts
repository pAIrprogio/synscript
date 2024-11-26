import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dir } from "./dir.lib.ts";
import { file } from "./file.lib.ts";

describe("File", () => {
  describe("file", () => {
    it("creates a file from a path", () => {
      const testFile = file("/super/path/test.txt");
      assert.equal(testFile.path, "/super/path/test.txt");
    });
  });
  describe("toFile", () => {
    it("creates a file from a relative path", () => {
      const testFile = file("/super/path/test.txt");
      assert.equal(testFile.toFile("../other.txt").path, "/super/other.txt");
    });
  });
  describe("toDir", () => {
    it("creates a dir from a relative path", () => {
      const testFile = file("/super/path/test.txt");
      assert.equal(testFile.toDir("../other").path, "/super/other");
    });
  });
  describe("relativePathTo", () => {
    it("returns the relative path to another file", () => {
      const testFile = file("/super/path/test.txt");
      assert.equal(
        testFile.relativePathTo(file("/super/other/other.txt")),
        "../other/other.txt",
      );
    });
    it("returns the relative path to another folder", () => {
      assert.equal(
        file("/super/path/test.txt").relativePathTo(dir("/super/other")),
        "../other",
      );
    });
  });
  describe("relativePathFrom", () => {
    it("returns the relative path from another file", () => {
      const testFile = file("/super/path/test.txt");
      assert.equal(
        testFile.relativePathFrom(file("/super/other/other.txt")),
        "../path/test.txt",
      );
    });
    it("returns the relative path from another folder", () => {
      const testFile = file("/super/path/test.txt");
      assert.equal(
        testFile.relativePathFrom(dir("/super/other")),
        "../path/test.txt",
      );
    });
  });
});
