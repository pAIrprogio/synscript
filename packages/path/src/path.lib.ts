import mime from "mime-types";
import * as fsPath from "path";
import { fileURLToPath } from "url";

/**
 * Type representing an absolute file system path.
 * Used for type safety when working with paths.
 */
export type AbsolutePath = string & { ABSOLUTE_PATH: true };

/**
 * Type representing a relative file system path.
 * Used for type safety when working with paths.
 */
export type RelativePath = string & { RELATIVE_PATH: true };

/**
 * Type representing any kind of file system path (absolute or relative).
 */
export type AnyPath = string;

/**
 * Exception thrown when a path operation is attempted outside the current working directory.
 */
export class PathNotInCwdException extends Error {
  constructor(path: string, cwd: string) {
    super(`Path ${path} is not in cwd ${cwd}`);
  }
}

/**
 * Resolves a sequence of paths or path segments into an absolute path.
 *
 * @param paths - One or more path segments to resolve
 * @returns An absolute path string
 *
 * ```typescript
 * const absolutePath = resolve("/base", "subdir", "file.txt");
 * console.log(absolutePath); // "/base/subdir/file.txt"
 * ```
 */
export function resolve(...paths: Array<AnyPath>) {
  if (paths.length === 0) {
    throw new Error("No paths provided");
  }
  return fsPath.resolve(...paths) as AbsolutePath;
}

/**
 * Determines if the given path is absolute.
 *
 * @param path - The path to check
 * @returns True if the path is absolute, false otherwise
 *
 * ```typescript
 * console.log(isAbsolute("/absolute/path")); // true
 * console.log(isAbsolute("relative/path")); // false
 * ```
 */
export function isAbsolute(path: AnyPath): path is AbsolutePath {
  return fsPath.isAbsolute(path);
}

/**
 * Returns the directory name of a path.
 * The result is always an absolute path.
 *
 * @param path - The path to get the directory name from
 * @returns The absolute path of the directory containing the path
 *
 * ```typescript
 * const dir = dirname("/path/to/file.txt");
 * console.log(dir); // "/path/to"
 * ```
 */
export function dirname(path: AnyPath): AbsolutePath {
  return fsPath.dirname(resolve(path)) as AbsolutePath;
}

/**
 * Checks if a path is contained within a base path.
 *
 * @param basePath - The base path to check against
 * @param path - The path to check
 * @returns True if the path is within the base path, false otherwise
 *
 * ```typescript
 * console.log(isInPath("/base", "/base/subdir")); // true
 * console.log(isInPath("/base", "/other")); // false
 * ```
 */
export function isInPath(basePath: AnyPath, path: AnyPath): boolean {
  const resolvedBasePath = resolve(basePath);
  const resolvedPath = resolve(path);
  return resolvedPath.startsWith(resolvedBasePath);
}

/**
 * Creates a relative path from one location to another.
 *
 * @param basePath - The base path to create the relative path from
 * @param path - The target path to create the relative path to
 * @returns A relative path from basePath to path
 *
 * ```typescript
 * const rel = relative("/base/dir", "/base/dir/subdir/file.txt");
 * console.log(rel); // "subdir/file.txt"
 * ```
 */
export function relative(basePath: AnyPath, path: AnyPath): RelativePath {
  return removeRelativeIndicator(
    fsPath.relative(basePath, path),
  ) as RelativePath;
}

/**
 * Adds a file extension to a path if it's not already present.
 *
 * @param path - The path to add the extension to
 * @param ext - The extension to add (without the leading dot)
 * @returns The path with the extension added
 *
 * ```typescript
 * const withExt = addMissingExtension("/path/to/file", "txt");
 * console.log(withExt); // "/path/to/file.txt"
 *
 * const alreadyHasExt = addMissingExtension("/path/to/file.txt", "txt");
 * console.log(alreadyHasExt); // "/path/to/file.txt"
 * ```
 */
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

/**
 * Joins path segments together.
 * The type of the first argument determines the type of the result.
 *
 * @param cwd - The base path (determines return type)
 * @param paths - Additional path segments to join
 * @returns The joined path
 *
 * ```typescript
 * const abs = join("/absolute", "path", "file.txt");
 * console.log(abs); // "/absolute/path/file.txt"
 *
 * const rel = join("relative", "path", "file.txt");
 * console.log(rel); // "relative/path/file.txt"
 * ```
 */
export function join(cwd: AbsolutePath, ...paths: Array<AnyPath>): AbsolutePath;
export function join(cwd: RelativePath, ...paths: Array<AnyPath>): RelativePath;
export function join(...paths: Array<AnyPath>): AnyPath;
export function join(cwd: AnyPath, ...paths: Array<AnyPath>): AnyPath {
  return fsPath.join(cwd, ...paths);
}

/**
 * Removes the leading "./" from a path if present.
 * Preserves the path type (absolute or relative).
 *
 * @param path - The path to process
 * @returns The path without the leading "./"
 *
 * ```typescript
 * console.log(removeRelativeIndicator("./file.txt")); // "file.txt"
 * console.log(removeRelativeIndicator("file.txt")); // "file.txt"
 * ```
 */
export function removeRelativeIndicator(path: AbsolutePath): AbsolutePath;
export function removeRelativeIndicator(path: RelativePath): RelativePath;
export function removeRelativeIndicator(path: AnyPath): AnyPath;
export function removeRelativeIndicator(path: AnyPath): AnyPath {
  return path.replace(/^\.\//, "");
}

/**
 * Ensures a file path has a specific extension.
 * If the path already ends with the extension, it is returned unchanged.
 *
 * @param filePath - The file path to process
 * @param extension - The extension to ensure (including the dot)
 * @returns The path with the specified extension
 *
 * ```typescript
 * const path = ensureFileExtension("/path/to/file", ".txt");
 * console.log(path); // "/path/to/file.txt"
 * ```
 */
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
  const normalizedExt = extension.startsWith(".") ? extension : `.${extension}`;
  if (filePath.endsWith(normalizedExt)) return filePath;
  return `${filePath}${normalizedExt}`;
}

/**
 * Converts an import URL to an absolute file system path.
 * Useful when working with ES modules and import.meta.url.
 *
 * @param importUrl - The import URL to convert
 * @returns The absolute path corresponding to the import URL
 *
 * ```typescript
 * const path = importUrlToAbsolutePath(import.meta.url);
 * console.log(path); // "/absolute/path/to/current/file"
 * ```
 */
export const importUrlToAbsolutePath = (importUrl: string): AbsolutePath => {
  return fsPath.dirname(fileURLToPath(importUrl)) as AbsolutePath;
};

/**
 * Gets the filename with extension from a path.
 *
 * @param path - The path to extract the filename from
 * @returns The filename with extension
 *
 * ```typescript
 * console.log(filename("/path/to/file.txt")); // "file.txt"
 * ```
 */
export const filename = (path: AnyPath): string => {
  return fsPath.parse(path).base;
};

/**
 * Gets the filename without extension from a path.
 *
 * @param path - The path to extract the filename from
 * @returns The filename without extension
 *
 * ```typescript
 * console.log(filenameWithoutExtension("/path/to/file.txt")); // "file"
 * ```
 */
export const filenameWithoutExtension = (path: AnyPath): string => {
  return fsPath.parse(path).name;
};

/**
 * Gets the file extension from a path.
 *
 * @param path - The path to extract the extension from
 * @returns The file extension (including the dot)
 *
 * ```typescript
 * console.log(fileExtension("/path/to/file.txt")); // ".txt"
 * ```
 */
export const fileExtension = (path: AnyPath): string => {
  return fsPath.parse(path).ext;
};

/**
 * Gets the MIME type for a file based on its extension.
 *
 * @param path - The path to get the MIME type for
 * @returns The MIME type string or null if it cannot be determined
 *
 * ```typescript
 * console.log(mimeType("/path/to/image.png")); // "image/png"
 * console.log(mimeType("/path/to/unknown")); // null
 * ```
 */
export const mimeType = (path: AnyPath): string | null => {
  const type = mime.lookup(path);
  if (!type) return null;
  return type;
};
