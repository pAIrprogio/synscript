import { git } from "@synstack/git";
import { glob } from "@synstack/glob";
import { type AnyPath, path } from "@synstack/path";
import { Pipeable } from "@synstack/pipe";
import * as fsSync from "fs";
import * as fs from "fs/promises";
import { FsFile } from "./file.lib.ts";
import { files, filesFromDir, type FsFileArrayMethods } from "./files-array.lib.ts";

export class FsDir extends Pipeable<FsDir> {
  private readonly _path: AnyPath;

  private constructor(path: AnyPath) {
    super();
    this._path = path;
  }

  /**
   * Get the string representation of the directory path.
   *
   * @returns The absolute path of the directory as a string
   *
   * ```typescript
   * const srcDir = dir("./src");
   * console.log(srcDir.toString()); // "/absolute/path/to/src"
   * ```
   */
  public toString(): AnyPath {
    return this._path;
  }

  /**
   * Get the primitive value of the directory path.
   *
   * @returns The absolute path of the directory
   */
  public valueOf(): AnyPath {
    return this._path;
  }

  /**
   * Get the current instance of the directory.
   * Used for type compatibility with Pipeable.
   *
   * @returns The current FsDir instance
   */
  public instanceOf(): FsDir {
    return this;
  }

  /**
   * Get the absolute path of the directory.
   *
   * @returns The absolute path as a string
   *
   * ```typescript
   * const srcDir = dir("./src");
   * console.log(srcDir.path); // "/absolute/path/to/src"
   * ```
   */
  public get path(): AnyPath {
    return this._path;
  }

  /**
   * Create a new directory instance with the provided path.
   * Resolves relative paths to absolute paths.
   *
   * @param paths - One or more path segments to join into a directory path
   * @returns A new FsDir instance with the resolved path
   *
   * ```typescript
   * // Create from absolute path
   * const rootDir = dir("/path/to/project");
   *
   * // Create from relative path
   * const srcDir = dir("./src");
   *
   * // Create from multiple segments
   * const configDir = dir("project", "config");
   * ```
   */
  public static cwd(this: void, ...paths: Array<string>) {
    return new FsDir(path.resolve(...paths));
  }

  /**
   * Create a new directory instance with a path relative to this directory.
   *
   * @param relativePath - The relative path to append to the current directory
   * @returns A new FsDir instance representing the combined path
   *
   * ```typescript
   * const projectDir = dir("/path/to/project");
   *
   * // Navigate to subdirectories
   * const srcDir = projectDir.to("src");
   * const testDir = projectDir.to("tests");
   *
   * // Navigate up and down
   * const siblingDir = srcDir.to("../other");
   * ```
   */
  public to(relativePath: string) {
    const newPath = path.join(this._path, relativePath);
    return new FsDir(newPath);
  }

  /**
   * Create a new file instance with a path relative to this directory.
   *
   * @param relativePath - The relative path to the file from this directory
   * @returns A new FsFile instance for the specified path
   * @throws If an absolute path is provided
   *
   * ```typescript
   * const srcDir = dir("./src");
   *
   * // Access files in the directory
   * const configFile = srcDir.file("config.json");
   * const deepFile = srcDir.file("components/Button.tsx");
   *
   * // Error: Cannot use absolute paths
   * srcDir.file("/absolute/path"); // throws Error
   * ```
   */
  public file(relativePath: string) {
    if (path.isAbsolute(relativePath))
      throw new Error(`
Trying to access a dir file from an absolute paths:
  - Folder path: ${this._path}
  - File path: ${relativePath}
`);
    return FsFile.from(this._path, relativePath);
  }

  /**
   * Get the name of the directory (last segment of the path).
   *
   * @returns The directory name without the full path
   *
   * ```typescript
   * const srcDir = dir("/path/to/project/src");
   * console.log(srcDir.name()); // "src"
   * ```
   */
  public name(): string {
    return path.filename(this._path);
  }

  /**
   * Check if the directory exists in the file system.
   *
   * @returns A promise that resolves to true if the directory exists, false otherwise
   *
   * ```typescript
   * const configDir = dir("./config");
   *
   * if (await configDir.exists()) {
   *   // Directory exists, safe to use
   *   const files = await configDir.glob("*.json");
   * } else {
   *   // Create the directory first
   *   await configDir.make();
   * }
   * ```
   */
  public async exists(): Promise<boolean> {
    return fs
      .access(this._path, fsSync.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Check if the directory exists in the file system synchronously.
   *
   * @synchronous
   * @returns True if the directory exists, false otherwise
   *
   * ```typescript
   * const configDir = dir("./config");
   *
   * if (configDir.existsSync()) {
   *   // Directory exists, safe to use
   *   const files = configDir.globSync("*.json");
   * } else {
   *   // Create the directory first
   *   configDir.makeSync();
   * }
   * ```
   */
  public existsSync(): boolean {
    try {
      fsSync.accessSync(this._path, fsSync.constants.F_OK);
      return true;
    } catch (error: any) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
  }

  /**
   * Create the directory and any necessary parent directories.
   *
   * @returns A promise that resolves when the directory is created
   *
   * ```typescript
   * const assetsDir = dir("./dist/assets/images");
   *
   * // Creates all necessary parent directories
   * await assetsDir.make();
   * ```
   */
  public async make(): Promise<void> {
    await fs.mkdir(this._path, { recursive: true });
  }

  /**
   * Create the directory and any necessary parent directories synchronously.
   *
   * @synchronous
   *
   * ```typescript
   * const assetsDir = dir("./dist/assets/images");
   *
   * // Creates all necessary parent directories immediately
   * assetsDir.makeSync();
   * ```
   */
  public makeSync(): void {
    fsSync.mkdirSync(this._path, { recursive: true });
  }

  /**
   * Remove the directory and all its contents recursively.
   * If the directory doesn't exist, the operation is silently ignored.
   *
   * @returns A promise that resolves when the directory is removed
   *
   * ```typescript
   * const tempDir = dir("./temp");
   *
   * // Remove directory and all contents
   * await tempDir.rm();
   * ```
   */
  public async rm(): Promise<void> {
    await fs.rm(this._path, { recursive: true }).catch((e) => {
      if (e.code === "ENOENT") return;
      throw e;
    });
  }

  /**
   * Remove the directory and all its contents recursively synchronously.
   * If the directory doesn't exist, the operation is silently ignored.
   *
   * @synchronous
   *
   * ```typescript
   * const tempDir = dir("./temp");
   *
   * // Remove directory and all contents immediately
   * tempDir.rmSync();
   * ```
   */
  public rmSync(): void {
    try {
      fsSync.rmSync(this._path, { recursive: true });
    } catch (error: any) {
      if (error.code === "ENOENT") return;
      throw error;
    }
  }

  /**
   * Find files in the directory that match the specified glob patterns.
   *
   * @param patterns - One or more glob patterns to match against
   * @returns A promise that resolves to an FsFileArray containing the matching files
   *
   * ```typescript
   * const srcDir = dir("./src");
   *
   * // Find all TypeScript files
   * const tsFiles = await srcDir.glob("**\/*.ts");
   *
   * // Find multiple file types
   * const assets = await srcDir.glob("**\/*.{png,jpg,svg}");
   *
   * // Use array of patterns
   * const configs = await srcDir.glob(["*.json", "*.yaml"]);
   * ```
   */
  public async glob(...patterns: Array<string> | [Array<string>]) {
    return glob
      .cwd(this._path)
      .find(...patterns)
      .then(filesFromDir(this));
  }

  /**
   * Find files in the directory that match the specified glob patterns synchronously.
   *
   * @param patterns - One or more glob patterns to match against
   * @returns An FsFileArray containing the matching files
   * @synchronous
   *
   * ```typescript
   * const srcDir = dir("./src");
   *
   * // Find all TypeScript files synchronously
   * const tsFiles = srcDir.globSync("**\/*.ts");
   *
   * // Find multiple file types
   * const assets = srcDir.globSync("**\/*.{png,jpg,svg}");
   * ```
   */
  public globSync(...patterns: Array<string> | [Array<string>]) {
    return filesFromDir(this)(glob.cwd(this._path).findSync(...patterns));
  }

  /**
   * Find files tracked by git in the directory.
   *
   * @param subPath - Optional sub-path to limit the search
   * @returns A promise that resolves to an FsFileArray containing the git-tracked files
   *
   * ```typescript
   * const projectDir = dir("./project");
   *
   * // Get all git-tracked files
   * const trackedFiles = await projectDir.gitLs();
   *
   * // Get tracked files in a subdirectory
   * const srcFiles = await projectDir.gitLs("src");
   * ```
   */
  public async gitLs(subPath?: AnyPath) {
    return git.ls(this._path, subPath).then(files);
  }
}

/**
 * Creates a new FsDir instance with the provided path.
 * @param paths - One or more path segments to join
 * @returns A new FsDir instance
 *
 * ```typescript
 * import { dir } from "@synstack/fs";
 *
 * const projectDir = dir("./project");
 * const srcDir = dir("/absolute/path/to/src");
 * ```
 */
export const dir = FsDir.cwd;
