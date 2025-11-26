import assert from "node:assert/strict";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { fsDir } from "./dir.lib.ts";
import { fsFile } from "./file.lib.ts";

describe("Dir", () => {
  describe("isParentOf", () => {
    it("returns true when file is inside directory", () => {
      const parentDir = fsDir("/path/to");
      assert.equal(parentDir.isParentOf(fsFile("/path/to/file.txt")), true);
    });

    it("returns true when file is in nested subdirectory", () => {
      const parentDir = fsDir("/path/to");
      assert.equal(
        parentDir.isParentOf(fsFile("/path/to/deep/nested/file.txt")),
        true,
      );
    });

    it("returns true when directory is inside parent directory", () => {
      const parentDir = fsDir("/path/to");
      assert.equal(parentDir.isParentOf(fsDir("/path/to/subdir")), true);
    });

    it("returns false when file is outside directory", () => {
      const parentDir = fsDir("/path/to");
      assert.equal(parentDir.isParentOf(fsFile("/other/file.txt")), false);
    });

    it("returns false when file is in sibling directory", () => {
      const parentDir = fsDir("/path/to");
      assert.equal(parentDir.isParentOf(fsFile("/path/other/file.txt")), false);
    });

    it("returns false for the directory itself", () => {
      const parentDir = fsDir("/path/to");
      assert.equal(parentDir.isParentOf(fsDir("/path/to")), false);
    });

    it("works with string paths", () => {
      const parentDir = fsDir("/path/to");
      assert.equal(parentDir.isParentOf("/path/to/file.txt"), true);
      assert.equal(parentDir.isParentOf("/other/file.txt"), false);
    });
  });
});
