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
}

const filesArrayMethods: FsFileArrayMethods = {
  filter(fn) {
    return filesArray(this.$.filter(fn));
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
};

export type FsFileArray = Enhanced<
  "files_array",
  Array<FsFile<any>>,
  FsFileArrayMethods
>;

export const filesArray = (files: Array<FsFile<any> | AnyPath>): FsFileArray =>
  enhance(
    "files_array",
    files.map((f) => (f instanceof FsFile ? f : file(f))),
    filesArrayMethods,
  );
