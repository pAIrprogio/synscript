import { git } from "@synstack/git";
import { glob } from "@synstack/glob";
import { type AnyPath, path } from "@synstack/path";
import { Pipeable } from "@synstack/pipe";
import type { TemplateExpression } from "execa";
import * as fsSync from "fs";
import * as fs from "fs/promises";
import { dirs } from "./dirs-array.lib.ts";
import { FsFile } from "./file.lib.ts";
import { fsFiles, fsFilesFromDir } from "./files-array.lib.ts";

export class FsDir extends Pipeable<FsDir> {
  private readonly _path: AnyPath;

  protected constructor(path: AnyPath) {
    super();
    this._path = path;
  }

  /**
   * Get the string representation of the directory path.
   *
   * @returns The absolute path of the directory as a string
   *
   * ```typescript
   * const srcDir = fsDir("./src");
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
   * const srcDir = fsDir("./src");
   * console.log(srcDir.path); // "/absolute/path/to/src"
   * ```
   */
  public get path(): AnyPath {
    return this._path;
  }

  /**
   * Get the relative path from this directory to another file/directory
   *
   * @param dirOrfile - The other directory
   * @returns The relative path as a string
   */
  public relativePathTo(dirOrfile: FsDir | FsFile) {
    return path.relative(this.path, dirOrfile.path);
  }

  /**
   * Get the relative path from another file/directory to this directory
   *
   * @param dirOrFile - The other directory
   * @returns The relative path as a string
   */
  public relativePathFrom(dirOrFile: FsDir | FsFile): string {
    if (dirOrFile instanceof FsFile)
      return this.relativePathFrom(dirOrFile.dir());
    return path.relative(dirOrFile.path, this.path);
  }

  /**
   * Create a new directory instance with the provided path(s).
   * Resolves relative paths to absolute paths.
   *
   * @param arg - A path or an existing FsDir instance
   * @returns A new FsDir instance with the resolved path
   *
   * ```typescript
   * // Create from absolute path
   * const rootDir = fsDir("/path/to/project");
   *
   * // Create from relative path
   * const srcDir = fsDir("./src");
   *
   * // Create from existing directory
   * const existingDir = fsDir(fsDir("/path/to/existing"));
   * ```
   */
  public static cwd(this: void, arg: FsDir | AnyPath): FsDir;
  public static cwd(this: void, arg: FsDir | AnyPath) {
    if (arg instanceof FsDir) return arg;
    return new FsDir(path.resolve(arg));
  }

  /**
   * Create a new directory instance with a path relative to this directory.
   *
   * @alias {@link to}
   * @param relativePath - The relative path to append to the current directory
   * @returns A new FsDir instance representing the combined path
   *
   * ```typescript
   * const projectDir = fsDir("/path/to/project");
   *
   * // Navigate to subdirectories
   * const srcDir = projectDir.toDir("src");
   * const testDir = projectDir.toDir("tests");
   *
   * // Navigate up and down
   * const siblingDir = srcDir.toDir("../other");
   * ```
   */
  public toDir(relativePath: string) {
    const newPath = path.join(this._path, relativePath);
    return new FsDir(newPath);
  }

  /**
   * Create a new directory instance with a path relative to this directory.
   *
   * @alias {@link toDir}
   * @param relativePath - The relative path to append to the current directory
   * @returns A new FsDir instance representing the combined path
   *
   * ```typescript
   * const projectDir = fsDir("/path/to/project");
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
    return this.toDir(relativePath);
  }

  /**
   * Create a new file instance with a path relative to this directory.
   *
   * @alias {@link file}
   * @param relativePath - The relative path to the file from this directory
   * @returns A new FsFile instance for the specified path
   * @throws If an absolute path is provided
   *
   * ```typescript
   * const srcDir = fsDir("./src");
   *
   * // Access files in the directory
   * const configFile = srcDir.toFile("config.json");
   * const deepFile = srcDir.toFile("components/Button.tsx");
   *
   * // Error: Cannot use absolute paths
   * srcDir.toFile("/absolute/path"); // throws Error
   * ```
   */
  public toFile(relativePath: string) {
    if (path.isAbsolute(relativePath))
      throw new Error(`
Trying to access a dir file from an absolute paths:
  - Folder path: ${this._path}
  - File path: ${relativePath}
`);
    return FsFile.from(path.resolve(this._path, relativePath));
  }

  /**
   * Create a new file instance with a path relative to this directory.
   *
   * @alias {@link toFile}
   * @param relativePath - The relative path to the file from this directory
   * @returns A new FsFile instance for the specified path
   * @throws If an absolute path is provided
   *
   * ```typescript
   * const srcDir = fsDir("./src");
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
    return this.toFile(relativePath);
  }

  /**
   * Get the name of the directory (last segment of the path).
   *
   * @returns The directory name without the full path
   *
   * ```typescript
   * const srcDir = fsDir("/path/to/project/src");
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
   * const configDir = fsDir("./config");
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
      .catch((error: any) => {
        if (error.code === "ENOENT") return false;
        throw new Error(
          `Failed to check existence of directory ${this._path}`,
          {
            cause: error,
          },
        );
      });
  }

  /**
   * Check if the directory exists in the file system synchronously.
   *
   * @synchronous
   * @returns True if the directory exists, false otherwise
   *
   * ```typescript
   * const configDir = fsDir("./config");
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
      throw new Error(`Failed to check existence of directory ${this._path}`, {
        cause: error,
      });
    }
  }

  /**
   * Create the directory and any necessary parent directories.
   *
   * @returns A promise that resolves when the directory is created
   *
   * ```typescript
   * const assetsDir = fsDir("./dist/assets/images");
   *
   * // Creates all necessary parent directories
   * await assetsDir.make();
   * ```
   */
  public async make(): Promise<void> {
    try {
      await fs.mkdir(this._path, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${this._path}`, {
        cause: error,
      });
    }
  }

  /**
   * Create the directory and any necessary parent directories synchronously.
   *
   * @synchronous
   *
   * ```typescript
   * const assetsDir = fsDir("./dist/assets/images");
   *
   * // Creates all necessary parent directories immediately
   * assetsDir.makeSync();
   * ```
   */
  public makeSync(): void {
    try {
      fsSync.mkdirSync(this._path, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${this._path}`, {
        cause: error,
      });
    }
  }

  /**
   * Copy the directory and all its contents to a new location.
   *
   * @param toDir - The destination path for the directory or an existing FsDir instance
   * @returns A promise that resolves to the new copied directory
   * @throws If the copy operation fails
   *
   * ```typescript
   * import { fsDir } from "@synstack/fs";
   *
   * const sourceDir = fsDir("./source");
   * const copiedDir = await sourceDir.copyTo("./backup/source");
   * // Both directories now exist with the same content
   * ```
   */
  public async copyTo(toDir: FsDir | string): Promise<FsDir> {
    const destDir = FsDir.cwd(toDir);
    const parentDir = path.dirname(destDir.path);

    try {
      // Ensure parent directory exists
      await fs.mkdir(parentDir, { recursive: true });
      // Use native fs.cp with recursive option
      await fs.cp(this._path, destDir.path, { recursive: true });
      return destDir;
    } catch (error) {
      throw new Error(
        `Failed to copy directory from ${this._path} to ${destDir.path}`,
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Copy the directory and all its contents to a new location synchronously.
   *
   * @param toDir - The destination path for the directory or an existing FsDir instance
   * @returns The new copied directory
   * @throws If the copy operation fails
   *
   * ```typescript
   * import { fsDir } from "@synstack/fs";
   *
   * const sourceDir = fsDir("./source");
   * const copiedDir = sourceDir.copyToSync("./backup/source");
   * // Both directories now exist with the same content
   * ```
   */
  public copyToSync(toDir: FsDir | string): FsDir {
    const destDir = FsDir.cwd(toDir);
    const parentDir = path.dirname(destDir.path);

    try {
      // Ensure parent directory exists
      fsSync.mkdirSync(parentDir, { recursive: true });
      // Use native fsSync.cpSync with recursive option
      fsSync.cpSync(this._path, destDir.path, { recursive: true });
      return destDir;
    } catch (error) {
      throw new Error(
        `Failed to copy directory from ${this._path} to ${destDir.path}`,
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Move the directory to a new location.
   *
   * @param newPath - The new path for the directory
   * @returns A promise that resolves the new directory
   */
  public async move(newPath: FsDir | AnyPath): Promise<FsDir> {
    const newDir = FsDir.cwd(newPath);
    try {
      await fs.rename(this._path, newDir.path);
      return newDir;
    } catch (error) {
      throw new Error(
        `Failed to move directory from ${this._path} to ${newDir.path}`,
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Move the directory to a new location synchronously.
   *
   * @param newPath - The new path for the directory
   * @returns The new directory
   */
  public moveSync(newPath: FsDir | AnyPath): FsDir {
    const newDir = FsDir.cwd(newPath);
    try {
      fsSync.renameSync(this._path, newDir.path);
      return newDir;
    } catch (error) {
      throw new Error(
        `Failed to move directory from ${this._path} to ${newDir.path}`,
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Remove the directory and all its contents recursively.
   * If the directory doesn't exist, the operation is silently ignored.
   *
   * @returns A promise that resolves when the directory is removed
   *
   * ```typescript
   * const tempDir = fsDir("./temp");
   *
   * // Remove directory and all contents
   * await tempDir.rm();
   * ```
   */
  public async rm(): Promise<void> {
    try {
      await fs.rm(this._path, { recursive: true });
    } catch (error: any) {
      if (error.code === "ENOENT") return;
      throw new Error(`Failed to remove directory ${this._path}`, {
        cause: error,
      });
    }
  }

  /**
   * Remove the directory and all its contents recursively synchronously.
   * If the directory doesn't exist, the operation is silently ignored.
   *
   * @synchronous
   *
   * ```typescript
   * const tempDir = fsDir("./temp");
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
      throw new Error(`Failed to remove directory ${this._path}`, {
        cause: error,
      });
    }
  }

  /**
   * Find files in the directory that match the specified glob patterns.
   *
   * @param patterns - One or more glob patterns to match against
   * @returns A promise that resolves to an FsFileArray containing the matching files
   *
   * ```typescript
   * const srcDir = fsDir("./src");
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
  public glob(...patterns: Array<string> | [Array<string>]) {
    return glob
      .cwd(this._path)
      .options({ absolute: true })
      .find(...patterns)
      .then(fsFiles);
  }

  /**
   * Find files in the directory that match the specified glob patterns synchronously.
   *
   * @param patterns - One or more glob patterns to match against
   * @returns An FsFileArray containing the matching files
   * @synchronous
   *
   * ```typescript
   * const srcDir = fsDir("./src");
   *
   * // Find all TypeScript files synchronously
   * const tsFiles = srcDir.globSync("**\/*.ts");
   *
   * // Find multiple file types
   * const assets = srcDir.globSync("**\/*.{png,jpg,svg}");
   * ```
   */
  public globSync(...patterns: Array<string> | [Array<string>]) {
    return fsFiles(
      glob
        .cwd(this._path)
        .options({ absolute: true })
        .findSync(...patterns),
    );
  }

  /**
   * Find folders in the directory that match the specified glob patterns.
   *
   * @param patterns - One or more glob patterns to match against
   * @returns A promise that resolves to an FsDirArray containing the matching folders
   */
  public globDirs(...patterns: Array<string> | [Array<string>]) {
    const patternsWithTrailingSlash = patterns
      .flat()
      .map((p) => glob.ensureDirTrailingSlash(p));

    return glob
      .cwd(this._path)
      .options({ nodir: false, absolute: true })
      .find(patternsWithTrailingSlash)
      .then(dirs);
  }

  /**
   * Find folders in the directory that match the specified glob patterns synchronously.
   *
   * @param patterns - One or more glob patterns to match against
   * @returns An FsDirArray containing the matching folders
   * @synchronous
   */
  public globDirsSync(...patterns: Array<string> | [Array<string>]) {
    const patternsWithTrailingSlash = patterns
      .flat()
      .map((p) => glob.ensureDirTrailingSlash(p));

    return dirs(
      glob
        .cwd(this._path)
        .options({ nodir: false, absolute: true })
        .findSync(patternsWithTrailingSlash),
    );
  }

  /**
   * Find files tracked by git in the directory.
   *
   * @returns A promise that resolves to an FsFileArray containing the git-tracked files
   *
   * ```typescript
   * const projectDir = fsDir("./project");
   *
   * // Get all git-tracked files in the directory
   * const trackedFiles = await projectDir.gitLs();
   * ```
   */
  public async gitLs() {
    return git.ls(this._path).then(fsFilesFromDir(this));
  }

  /**
   * Execute a command in the directory.
   */
  public async exec(
    template: TemplateStringsArray,
    ...args: Array<TemplateExpression>
  ) {
    const { execa } = await import("execa").catch(() => {
      throw new Error(
        "The `execa` package is not installed. Please install it first.",
      );
    });
    return execa({ cwd: this.path })(template, ...args);
  }
}

/**
 * Create a new directory instance with the provided path.
 * Resolves relative paths to absolute paths.
 *
 * @param arg - A path or an existing FsDir instance
 * @returns A new FsDir instance with the resolved path
 *
 * ```typescript
 * // Create from absolute path
 * const rootDir = fsDir("/path/to/project");
 *
 * // Create from relative path
 * const srcDir = fsDir("./src");
 *
 * // Create from existing directory
 * const existingDir = fsDir(fsDir("/path/to/existing"));
 * ```
 */
export const fsDir = FsDir.cwd;

/**
 * @deprecated Changed to avoid namespacing conflicts. Use {@link fsDir} instead
 */
export const dir = FsDir.cwd;
