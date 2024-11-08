import { git } from "@synstack/git";
import { glob } from "@synstack/glob";
import { AnyPath, path } from "@synstack/path";
import { Pipeable } from "@synstack/pipe";
import * as fsSync from "fs";
import * as fs from "fs/promises";
import { FsFile } from "./file.lib";
import { files, filesFromDir } from "./files-array.lib";

export class FsDir extends Pipeable<FsDir> {
  private readonly _path: AnyPath;

  private constructor(path: AnyPath) {
    super();
    this._path = path;
  }

  public toString(): AnyPath {
    return this._path;
  }

  public valueOf(): AnyPath {
    return this._path;
  }

  public instanceOf(): FsDir {
    return this;
  }

  public get path(): AnyPath {
    return this._path;
  }

  public static cwd(this: void, ...paths: Array<string>) {
    return new FsDir(path.resolve(...paths));
  }

  public to(relativePath: string) {
    const newPath = path.join(this._path, relativePath);
    return new FsDir(newPath);
  }

  public file(relativePath: string) {
    if (path.isAbsolute(relativePath))
      throw new Error(`
Trying to access a dir file from an absolute paths:
  - Folder path: ${this._path}
  - File path: ${relativePath}
`);
    return FsFile.from(this._path, relativePath);
  }

  public name(): string {
    return path.filename(this._path);
  }

  public async exists(): Promise<boolean> {
    return fs
      .access(this._path, fsSync.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  }

  public existsSync(): boolean {
    try {
      fsSync.accessSync(this._path, fsSync.constants.F_OK);
      return true;
    } catch (error: any) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
  }

  public async make(): Promise<void> {
    await fs.mkdir(this._path, { recursive: true });
  }
  public makeSync(): void {
    fsSync.mkdirSync(this._path, { recursive: true });
  }

  public async rm(): Promise<void> {
    await fs.rm(this._path, { recursive: true });
  }

  public rmSync(): void {
    return fsSync.rmSync(this._path, { recursive: true });
  }

  public async glob(...patterns: Array<string> | [Array<string>]) {
    return glob
      .cwd(this._path)
      .find(...patterns)
      .then(filesFromDir(this));
  }

  public globSync(...patterns: Array<string> | [Array<string>]) {
    return filesFromDir(this)(glob.cwd(this._path).findSync(...patterns));
  }

  public async gitLs(subPath?: AnyPath) {
    return git.ls(this._path, subPath).then(files);
  }
}

export const dir = FsDir.cwd;
