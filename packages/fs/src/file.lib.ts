import { glob } from "@synstack/glob";
import { json } from "@synstack/json";
import { AbsolutePath, AnyPath, path } from "@synstack/path";
import { Pipeable } from "@synstack/pipe";
import { str } from "@synstack/str";
import { Xml, xml } from "@synstack/xml";
import { yaml } from "@synstack/yaml";
import * as fsSync from "fs";
import * as fs from "fs/promises";
import { FsDir } from "./dir.lib";

type TextEncoding = Exclude<BufferEncoding, "buffer">;
type WriteMode = "touch" | "write";

export interface Base64Data {
  type: "base64";
  data: string;
  mimeType: string;
}

export class FsFile<
  TPaths extends Array<AnyPath> = AnyPath[],
  TEncoding extends TextEncoding = "utf-8",
  TSchema extends Zod.Schema | undefined = undefined,
> extends Pipeable<FsFile<TPaths, TEncoding, TSchema>, AnyPath> {
  private readonly _path: AnyPath;
  private readonly _encoding: TEncoding;
  private readonly _schema?: TSchema;

  // Todo: include cwd to manage globs?
  public static from<U extends Array<AnyPath>>(this: void, ...paths: U) {
    return new FsFile<U, "utf-8", undefined>(path.join(...paths), "utf-8");
  }

  private constructor(path: AnyPath, encoding?: TEncoding, schema?: TSchema) {
    super();
    this._path = path;
    this._encoding = encoding ?? ("utf-8" as TEncoding);
    this._schema = schema ?? undefined;
  }

  public schema(schema: TSchema) {
    return new FsFile<TPaths, TEncoding, TSchema>(
      this._path,
      this._encoding,
      schema,
    );
  }

  public valueOf(): AnyPath {
    return this._path;
  }

  public instanceOf(): FsFile<TPaths, TEncoding, TSchema> {
    return this;
  }

  public absolutePath(): AbsolutePath {
    return path.resolve(this._path);
  }

  // #region sub actions

  public get read() {
    return new FsFileRead<TEncoding, TSchema>(
      this._path,
      this._encoding,
      this._schema,
    );
  }

  public get write() {
    return new FsFileWrite<TEncoding, TSchema>(
      this._path,
      this._encoding,
      "write",
      this._schema,
    );
  }

  // #endregion

  // #region sync

  public get path() {
    return this._path;
  }

  public dirPath() {
    // Todo: align function names
    return path.dirname(this._path);
  }

  public dir() {
    return FsDir.cwd(this.dirPath());
  }

  public contains(pathOrFileOrDir: AnyPath | FsFile | FsDir) {
    return path.isInPath(this._path, pathOrFileOrDir.valueOf());
  }

  public fileName() {
    return path.filename(this._path);
  }

  public fileExtension() {
    return path.fileExtension(this._path);
  }

  public fileNameWithoutExtension() {
    return path.filenameWithoutExtension(this._path);
  }

  public mimeType() {
    return path.mimeType(this._path);
  }

  public relativePathFrom(dirOrFileOrPath: AnyPath | FsDir | FsFile) {
    return path.relative(dirOrFileOrPath.valueOf(), this._path);
  }

  public relativePathTo(dirOrFileOrPath: string | FsDir | FsFile) {
    return path.relative(this._path, dirOrFileOrPath.valueOf());
  }

  public isInDir(dirOrPath: AnyPath | FsDir) {
    return path.isInPath(dirOrPath.valueOf(), this._path.valueOf());
  }

  public async rm(): Promise<void> {
    await fs.rm(this._path, { recursive: true });
  }

  public rmSync(): void {
    fsSync.rmSync(this._path, { recursive: false });
  }

  public async exists(): Promise<boolean> {
    try {
      await fs.access(this._path);
      return true;
    } catch {
      return false;
    }
  }

  public existsSync(): boolean {
    try {
      fsSync.accessSync(this._path);
      return true;
    } catch (error: any) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
  }

  public async creationDate(): Promise<Date> {
    const fileStats = await fs.stat(this._path);
    return fileStats.birthtime;
  }

  public creationDateSync(): Date {
    const stats = fsSync.statSync(this._path);
    return stats.birthtime;
  }

  public matchesGlobs(...globs: Array<string> | [Array<string>]) {
    return glob.matches(this._path, ...globs);
  }
}

class FsFileRead<
  TEncoding extends TextEncoding = "utf-8",
  TSchema extends Zod.Schema | undefined = undefined,
> {
  private readonly _path: AnyPath;
  private readonly _encoding: TEncoding;
  private readonly _schema?: TSchema;

  public constructor(path: AnyPath, encoding: TEncoding, schema?: TSchema) {
    this._path = path;
    this._encoding = encoding;
    this._schema = schema;
  }

  public get path() {
    return this._path;
  }

  // #region sync

  public async text() {
    return fs.readFile(this._path, this._encoding);
  }

  public textSync() {
    return fsSync.readFileSync(this._path, this._encoding);
  }

  public async str() {
    return this.text().then(str);
  }

  public strSync() {
    return str(this.textSync());
  }

  public async json<T = unknown>() {
    return this.text().then((t) =>
      json.deserialize<T>(t, { schema: this._schema }),
    );
  }

  public jsonSync<T = unknown>() {
    return json.deserialize<T>(this.textSync(), { schema: this._schema });
  }

  public async yaml<T = unknown>() {
    return this.text().then((t) =>
      yaml.deserialize<T>(t, { schema: this._schema }),
    );
  }

  public yamlSync<T = unknown>() {
    return yaml.deserialize<T>(this.textSync(), { schema: this._schema });
  }

  public async xml<T extends Array<Xml.Node>>() {
    return this.text().then(xml.parse<T>);
  }

  public xmlSync<T extends Array<Xml.Node>>() {
    return xml.parse<T>(this.textSync());
  }

  public async base64() {
    return fs.readFile(this._path, "base64");
  }

  public base64Sync() {
    return fsSync.readFileSync(this._path, "base64");
  }

  public async base64Data(
    defaultMimeType: string = "application/octet-stream",
  ) {
    return {
      type: "base64",
      data: await this.base64(),
      mimeType: defaultMimeType,
    } satisfies Base64Data;
  }

  public base64DataSync(defaultMimeType: string = "application/octet-stream") {
    return {
      type: "base64",
      data: this.base64Sync(),
      mimeType: defaultMimeType,
    } satisfies Base64Data;
  }
}

// Todo: Passing absolute paths will break the cache, find a way to fix this
class FsFileWrite<
  TEncoding extends TextEncoding,
  TSchema extends Zod.Schema | undefined = undefined,
> {
  private readonly _path: AnyPath;
  private readonly _encoding: TEncoding;
  private readonly _schema?: TSchema;
  private readonly _mode: WriteMode;

  public constructor(
    path: AnyPath,
    encoding: TEncoding,
    mode: WriteMode = "write",
    schema?: TSchema,
  ) {
    this._path = path;
    this._encoding = encoding;
    this._schema = schema;
    this._mode = mode;
  }

  public mode(mode: WriteMode) {
    return new FsFileWrite(this._path, this._encoding, mode, this._schema);
  }

  public async text(content: string): Promise<void> {
    if (this._mode === "touch" && (await FsFile.from(this._path).exists()))
      return;
    const dirname = path.dirname(this._path);
    await fs.mkdir(dirname, { recursive: true });
    await fs.writeFile(this._path, content, this._encoding);
  }

  public textSync(content: string): void {
    if (this._mode === "touch" && FsFile.from(this._path).existsSync()) return;
    const dirname = path.dirname(this._path);
    fsSync.mkdirSync(dirname, { recursive: true });
    fsSync.writeFileSync(this._path, content, this._encoding);
  }

  public async json<T>(data: T): Promise<void> {
    return this.text(json.serialize(data, { schema: this._schema }));
  }

  public jsonSync<T>(data: T): void {
    return this.textSync(json.serialize(data, { schema: this._schema }));
  }

  public async yaml<T>(data: T): Promise<void> {
    return this.text(yaml.serialize(data, { schema: this._schema }));
  }

  public yamlSync<T>(data: T): void {
    return this.textSync(yaml.serialize(data, { schema: this._schema }));
  }

  public async base64(data: string): Promise<void> {
    if (this._mode === "touch" && (await FsFile.from(this._path).exists()))
      return;
    const dirname = path.dirname(this._path);
    await fs.mkdir(dirname, { recursive: true });
    await fs.writeFile(this._path, data, "base64");
  }

  public base64Sync(data: string): void {
    if (this._mode === "touch" && FsFile.from(this._path).existsSync()) return;
    const dirname = path.dirname(this._path);
    fsSync.mkdirSync(dirname, { recursive: true });
    return fsSync.writeFileSync(this._path, data, "base64");
  }
}

export const file = FsFile.from;
