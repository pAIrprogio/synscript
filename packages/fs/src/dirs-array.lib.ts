import { enhance, type Enhanced } from "@synstack/enhance";
import { type AnyPath } from "@synstack/path";
import { fsDir, FsDir } from "./dir.lib.ts";
import type { FsFile } from "./file.lib.ts";

/**
 * Interface defining chainable methods for arrays of FsFile instances.
 * @internal
 */
export interface FsDirArrayMethods {
  filter(this: FsDirArray, fn: (dir: FsDir) => boolean): FsDirArray;
  toPaths(this: FsDirArray): Array<string>;
  relativePathsFrom(this: FsDirArray, dir: FsDir | FsFile): Array<string>;
}

const dirsArrayMethods: FsDirArrayMethods = {
  filter(fn) {
    return fsDirs(this.filter(fn));
  },

  toPaths() {
    return this.map((dir) => dir.path);
  },

  relativePathsFrom(dirOrFileOrPath) {
    return this.map((dir) => dir.relativePathFrom(dirOrFileOrPath));
  },
};

export type FsDirArray = Enhanced<
  "dirs_array",
  Array<FsDir>,
  FsDirArrayMethods
>;

/**
 * Create a new FsDirArray instance with the provided directories.
 * @param dirs - An array of FsDir or AnyPath instances
 * @returns A new FsDirArray instance
 */
export const fsDirs = (dirs: Array<FsDir | AnyPath>): FsDirArray =>
  enhance("dirs_array", dirs.map(fsDir), dirsArrayMethods);

/**
 * @deprecated Changed to avoid namespacing conflicts. Use {@link fsDirs} instead
 */
export const dirs = fsDirs;
