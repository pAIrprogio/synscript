import assert from "node:assert/strict";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { z } from "zod";
import { assertType } from "../../shared/src/ts.utils.ts";
import { fsDir } from "./dir.lib.ts";
import { fsFile } from "./file.lib.ts";

const _typeTests = async () => {
  const schema = z.object({
    id: z.string(),
    name: z.string(),
  });
  const schemaFile = fsFile("").schema(schema);
  type Output = z.infer<typeof schema>;

  assertType<Output>(await schemaFile.read.json());
  assertType<[1, 2]>(await fsFile("").read.json<[1, 2]>());
  assertType<Output>(schemaFile.read.jsonSync());
  assertType<Output>(await schemaFile.read.yaml());
  assertType<Output>(schemaFile.read.yamlSync());

  await schemaFile.write.json({ id: "1", name: "2" });
  await schemaFile.write.yaml({ id: "1", name: "2" });
  // @ts-expect-error
  await schemaFile.write.json({ id: "1" });
  // @ts-expect-error
  await schemaFile.write.yaml({ id: "1", name: 2 });
};

describe("File", () => {
  describe("file", () => {
    it("creates a file from a path", () => {
      const testFile = fsFile("/super/path/test.txt");
      assert.equal(testFile.path, resolve("/super/path/test.txt"));
    });
  });
  describe("toFile", () => {
    it("creates a file from a relative path", () => {
      const testFile = fsFile("/super/path/test.txt");
      assert.equal(
        testFile.toFile("../other.txt").path,
        resolve("/super/other.txt"),
      );
    });
  });
  describe("toDir", () => {
    it("creates a dir from a relative path", () => {
      const testFile = fsFile("/super/path/test.txt");
      assert.equal(testFile.toDir("../other").path, resolve("/super/other"));
    });
  });
  describe("relativePathTo", () => {
    it("returns the relative path to another file", () => {
      const testFile = fsFile("/super/path/test.txt");
      assert.equal(
        testFile.relativePathTo(fsFile("/super/other/other.txt")),
        "../other/other.txt",
      );
    });
    it("returns the relative path to another folder", () => {
      assert.equal(
        fsFile("/super/path/test.txt").relativePathTo(fsDir("/super/other")),
        "../other",
      );
    });
  });
  describe("relativePathFrom", () => {
    it("returns the relative path from another file", () => {
      const testFile = fsFile("/super/path/test.txt");
      assert.equal(
        testFile.relativePathFrom(fsFile("/super/other/other.txt")),
        "../path/test.txt",
      );
    });
    it("returns the relative path from another folder", () => {
      const testFile = fsFile("/super/path/test.txt");
      assert.equal(
        testFile.relativePathFrom(fsDir("/super/other")),
        "../path/test.txt",
      );
    });
  });
});
