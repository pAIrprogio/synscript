import { git } from "@synstack/git";
import { glob } from "@synstack/glob";
import { AnyPath, path } from "@synstack/path";
import { Pipeable } from "@synstack/pipe";
import * as fsSync from "fs";
import * as fs from "fs/promises";
import { FsFile } from "./file.lib";
import { filesArray } from "./files-array.lib";

export class FsDir<
  TPaths extends Array<string> = ["./<unknown>"],
> extends Pipeable<FsDir<TPaths>, AnyPath> {
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

  public instanceOf(): FsDir<TPaths> {
    return this;
  }

  public get path(): AnyPath {
    return this._path;
  }

  public static cwd<TPaths extends Array<string>>(
    this: void,
    ...paths: TPaths
  ) {
    return new FsDir<TPaths>(path.resolve(...paths));
  }

  public to<TPathPart extends AnyPath>(relativePath: TPathPart) {
    const newPath = path.join(this._path, relativePath);
    return new FsDir<[...TPaths, TPathPart]>(newPath);
  }

  public file<TPathPart extends AnyPath>(relativePath: TPathPart) {
    return FsFile.from(this._path, relativePath);
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
      .then(filesArray);
  }

  public globSync(...patterns: Array<string> | [Array<string>]) {
    return filesArray(glob.cwd(this._path).findSync(...patterns));
  }

  public async gitLs(subPath?: AnyPath) {
    return git.ls(this._path, subPath).then(filesArray);
  }
}

export const dir = FsDir.cwd;
