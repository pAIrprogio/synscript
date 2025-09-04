import { enhance, type Enhanced } from "@synstack/enhance";
import { type AnyPath } from "@synstack/path";
import { FsDir } from "./dir.lib.ts";
import { FsFile, fsFile } from "./file.lib.ts";

/**
 * Interface defining chainable methods for arrays of FsFile instances.
 * @internal
 */
export interface FsFileArrayMethods {
  filter(this: FsFileArray, fn: (file: FsFile<any>) => boolean): FsFileArray;
  filterGlobs(
    this: FsFileArray,
    ...patterns: Array<string> | [Array<string>]
  ): FsFileArray;
  filterMimeTypes(this: FsFileArray, ...mimeTypes: Array<string>): FsFileArray;
  filterDir(this: FsFileArray, dir: FsDir): FsFileArray;
  filterDir(this: FsFileArray, path: string): FsFileArray;
  toPaths(this: FsFileArray): Array<string>;
  relativePathsFrom(this: FsFileArray, dir: FsDir | FsFile): Array<string>;
}

const filesArrayMethods: FsFileArrayMethods = {
  filter(fn) {
    return fsFiles(this.filter(fn));
  },

  filterGlobs(...patterns) {
    return this.filter((file) => file.matchesGlobs(...patterns));
  },

  filterMimeTypes(...mimeTypes) {
    const types = new Set(mimeTypes);
    return this.filter((file) => {
      const mimeType = file.mimeType();
      if (mimeType === null) return false;
      return types.has(mimeType);
    });
  },

  filterDir(dirOrPath) {
    return this.filter((file) => file.isInDir(dirOrPath));
  },

  toPaths() {
    return this.map((file) => file.path);
  },

  relativePathsFrom(dirOrFileOrPath) {
    return this.map((file) => file.relativePathFrom(dirOrFileOrPath));
  },
};

export type FsFileArray = Enhanced<
  "files_array",
  Array<FsFile<any>>,
  FsFileArrayMethods
>;

/**
 * Create a new FsFileArray instance with the provided files.
 * @param files - An array of FsFile or paths
 * @returns A new FsFileArray instance
 */
export const fsFiles = (files: Array<FsFile<any> | AnyPath>): FsFileArray =>
  enhance(
    "files_array",
    files.map((f) => {
      if (f instanceof FsFile) return f;
      return fsFile(f);
    }),
    filesArrayMethods,
  );

/**
 * @deprecated Changed to avoid namespacing conflicts. Use {@link fsFiles} instead
 */
export const files = fsFiles;

/**
 * Create a new FsFileArray instance with the provided files relative to the cwd directory.
 * @param dir - The cwd directory
 * @param files - An array of relative paths from the cwd directory
 * @returns A new FsFileArray instance
 */
export const fsFilesFromDir =
  (dir: FsDir) =>
  (files: Array<FsFile<any> | AnyPath>): FsFileArray =>
    enhance(
      "files_array",
      files.map((f) => {
        if (f instanceof FsFile) return f;
        return dir.file(f);
      }),
      filesArrayMethods,
    );

/**
 * @deprecated Changed to match naming convention. Use {@link fsFilesFromDir} instead
 */
export const filesFromDir = fsFilesFromDir;
