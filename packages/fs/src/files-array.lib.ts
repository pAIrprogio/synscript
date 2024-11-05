import { enhance, Enhanced } from "@synstack/enhance";
import { AnyPath } from "@synstack/path";
import { FsDir } from "./dir.lib";
import { file, FsFile } from "./file.lib";

interface FsFileArrayMethods {
  filter(this: FsFileArray, fn: (file: FsFile<any>) => boolean): FsFileArray;
  filterGlobs(
    this: FsFileArray,
    ...patterns: Array<string> | [Array<string>]
  ): FsFileArray;
  filterMimeTypes(this: FsFileArray, ...mimeTypes: Array<string>): FsFileArray;
  filterDir(this: FsFileArray, dir: FsDir): FsFileArray;
  filterDir(this: FsFileArray, path: string): FsFileArray;
  toPaths(this: FsFileArray): Array<string>;
  relativePathsTo(
    this: FsFileArray,
    dir: string | FsDir | FsFile,
  ): Array<string>;
}

const filesArrayMethods: FsFileArrayMethods = {
  filter(fn) {
    return files(this.$.filter(fn));
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
  relativePathsTo(dirOrFileOrPath) {
    return this.map((file) => file.relativePathTo(dirOrFileOrPath));
  },
};

export type FsFileArray = Enhanced<
  "files_array",
  Array<FsFile<any>>,
  FsFileArrayMethods
>;

export const files = (files: Array<FsFile<any> | AnyPath>): FsFileArray =>
  enhance(
    "files_array",
    files.map((f) => {
      if (f instanceof FsFile) return f;
      return file(f);
    }),
    filesArrayMethods,
  );

export const filesFromDir =
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
