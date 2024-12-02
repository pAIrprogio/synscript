import { git } from "@synstack/git";
import { glob } from "@synstack/glob";
import { type AnyPath, path } from "@synstack/path";
import { Pipeable } from "@synstack/pipe";
import * as fsSync from "fs";
import * as fs from "fs/promises";
import { FsFile } from "./file.lib.ts";
import { files, filesFromDir } from "./files-array.lib.ts";

export class FsDir extends Pipeable<FsDir> {
  private readonly _path: AnyPath;

  private constructor(path: AnyPath) {
    super();
    this._path = path;
  }

  /**
   * @returns The absolute path of the directory
   */
  public toString(): AnyPath {
    return this._path;
  }

  /**
   * @returns The absolute path of the directory
   */
  public valueOf(): AnyPath {
    return this._path;
  }

  public instanceOf(): FsDir {
    return this;
  }

  /**
   * @returns The absolute path of the directory
   */
  public get path(): AnyPath {
    return this._path;
  }

  /**
   * Create a new directory instance with the provided path
   */
  public static cwd(this: void, ...paths: Array<string>) {
    return new FsDir(path.resolve(...paths));
  }

  /**
   * Generates a new FsDir instance by joining the given relative path
   * to the current directory's path
   *
   * @param relativePath - The relative path to append to the current directory
   * @returns A new FsDir instance representing the combined path
   */
  public to(relativePath: string) {
    const newPath = path.join(this._path, relativePath);
    return new FsDir(newPath);
  }

  /**
   * Generates a new FsFile instance by joining the given relative path
   * to the current directory's path
   *
   * @param relativePath - The relative path to append to the current directory.
   * @returns A new FsFile instance representing the combined path.
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
   * @returns The name of the directory
   */
  public name(): string {
    return path.filename(this._path);
  }

  /**
   * Checks if the directory exists
   */
  public async exists(): Promise<boolean> {
    return fs
      .access(this._path, fsSync.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Checks if the directory exists
   * @synchronous
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
   * Creates the directory if it doesn't exist
   */
  public async make(): Promise<void> {
    await fs.mkdir(this._path, { recursive: true });
  }

  /**
   * Creates the directory if it doesn't exist
   * @synchronous
   */
  public makeSync(): void {
    fsSync.mkdirSync(this._path, { recursive: true });
  }

  /**
   * Removes the directory and all its contents recursively
   */
  public async rm(): Promise<void> {
    await fs.rm(this._path, { recursive: true }).catch((e) => {
      if (e.code === "ENOENT") return;
      throw e;
    });
  }

  /**
   * Removes the directory and all its contents recursively
   * @synchronous
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
   * Runs a glob search on the directory and returns the matching files
   * @returns an FsFileArray instance with the matching files
   */
  public async glob(...patterns: Array<string> | [Array<string>]) {
    return glob
      .cwd(this._path)
      .find(...patterns)
      .then(filesFromDir(this));
  }

  /**
   * Runs a glob search on the directory and returns the matching files
   * @returns an FsFileArray instance with the matching files
   * @synchronous
   */
  public globSync(...patterns: Array<string> | [Array<string>]) {
    return filesFromDir(this)(glob.cwd(this._path).findSync(...patterns));
  }

  /**
   * Runs a git ls-files search on the directory and returns the matching files
   * @param subPath a sub path to be appended to the git ls-files search
   * @returns an FsFileArray instance with the matching files
   */
  public async gitLs(subPath?: AnyPath) {
    return git.ls(this._path, subPath).then(files);
  }
}

/**
 * Creates a new FsDir instance with the provided path
 */
export const dir = FsDir.cwd;
