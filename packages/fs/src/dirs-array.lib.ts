import { enhance, type Enhanced } from "@synstack/enhance";
import { type AnyPath } from "@synstack/path";
import { dir as fsDir, FsDir } from "./dir.lib.ts";
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
    return dirs(this.filter(fn));
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

export const dirs = (dirs: Array<FsDir | AnyPath>): FsDirArray =>
  enhance("dirs_array", dirs.map(fsDir), dirsArrayMethods);
