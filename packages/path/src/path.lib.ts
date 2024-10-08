import mime from "mime-types";
import os from "os";
import * as fsPath from "path";
import { fileURLToPath } from "url";

export type AbsolutePath = string & { ABSOLUTE_PATH: true };
export type RelativePath = string & { RELATIVE_PATH: true };
export type AnyPath = string;

export class PathNotInCwdException extends Error {
  constructor(path: string, cwd: string) {
    super(`Path ${path} is not in cwd ${cwd}`);
  }
}

const isOsx = os.platform() === "darwin";

export function resolve(...paths: Array<AnyPath>) {
  return fsPath.resolve(...paths) as AbsolutePath;
}

export function isAbsolute(path: AnyPath): path is AbsolutePath {
  return fsPath.isAbsolute(path);
}

export function dirname(path: AnyPath): AbsolutePath {
  return fsPath.dirname(resolve(path)) as AbsolutePath;
}

export function isInPath(basePath: AnyPath, path: AnyPath): boolean {
  const resolvedBasePath = resolve(basePath);
  const resolvedPath = resolve(path);
  return resolvedPath.startsWith(resolvedBasePath);
}

export function relative(basePath: AnyPath, path: AnyPath): RelativePath {
  return removeRelativeIndicator(
    fsPath.relative(basePath, path),
  ) as RelativePath;
}

export function addMissingExtension(
  path: AbsolutePath,
  ext: string,
): AbsolutePath;
export function addMissingExtension(
  path: RelativePath,
  ext: string,
): RelativePath;
export function addMissingExtension(path: AnyPath, ext: string) {
  return path.endsWith(ext) ? path : `${path}.${ext}`;
}

export function join(cwd: AbsolutePath, ...paths: Array<AnyPath>): AbsolutePath;
export function join(cwd: RelativePath, ...paths: Array<AnyPath>): RelativePath;
export function join(...paths: Array<AnyPath>): AnyPath;
export function join(cwd: AnyPath, ...paths: Array<AnyPath>): AnyPath {
  return fsPath.join(cwd, ...paths);
}

export function removeRelativeIndicator(path: AbsolutePath): AbsolutePath;
export function removeRelativeIndicator(path: RelativePath): RelativePath;
export function removeRelativeIndicator(path: AnyPath): AnyPath;
export function removeRelativeIndicator(path: AnyPath): AnyPath {
  return path.replace(/^\.\//, "");
}

export function ensureFileExtension(
  filePath: AbsolutePath,
  extension: string,
): AbsolutePath;
export function ensureFileExtension(
  filePath: RelativePath,
  extension: string,
): RelativePath;
export function ensureFileExtension(
  filePath: AnyPath,
  extension: string,
): AnyPath;
export function ensureFileExtension(filePath: AnyPath, extension: string) {
  if (filePath.endsWith(extension)) return filePath;
  return `${filePath}.${extension}`;
}

export const importUrlToAbsolutePath = (importUrl: string): AbsolutePath => {
  return fsPath.dirname(fileURLToPath(importUrl)) as AbsolutePath;
};

export const filename = (path: AnyPath): string => {
  return fsPath.parse(path).base;
};

export const filenameWithoutExtension = (path: AnyPath): string => {
  return fsPath.parse(path).name;
};

export const fileExtension = (path: AnyPath): string => {
  return fsPath.parse(path).ext;
};

export const mimeType = (path: AnyPath): string | null => {
  const type = mime.lookup(path);
  if (!type) return null;
  return type;
};
