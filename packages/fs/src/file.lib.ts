import { Stringable } from "@shared/ts.utils";
import { glob } from "@synstack/glob";
import { json } from "@synstack/json";
import { AnyPath, path } from "@synstack/path";
import { Pipeable } from "@synstack/pipe";
import { str } from "@synstack/str";
import { Xml, xml } from "@synstack/xml";
import { yaml } from "@synstack/yaml";
import * as fsSync from "fs";
import * as fs from "fs/promises";
import { ZodSchema } from "zod";
import { FsDir } from "./dir.lib";

type TextEncoding = Exclude<BufferEncoding, "buffer">;
type WriteMode = "preserve" | "overwrite";

export interface Base64Data {
  type: "base64";
  data: string;
  mimeType: string;
}

export class FsFile<
  TEncoding extends TextEncoding = "utf-8",
  TSchema extends Zod.Schema | undefined = undefined,
> extends Pipeable<FsFile<TEncoding, TSchema>, AnyPath> {
  private readonly _path: AnyPath;
  private readonly _encoding: TEncoding;
  private readonly _schema?: TSchema;

  /**
   * Create a new FsFile instance from a path or a list of paths to be resolved
   * Path will be an absolute path
   */
  public static from(this: void, ...paths: Array<AnyPath>) {
    // Todo: check if resolving is preferable to joining
    return new FsFile<"utf-8", undefined>(path.join(...paths), "utf-8");
  }

  private constructor(path: AnyPath, encoding?: TEncoding, schema?: TSchema) {
    super();
    this._path = path;
    this._encoding = encoding ?? ("utf-8" as TEncoding);
    this._schema = schema ?? undefined;
  }

  /**
   * Provide a validation schema for the file content. To be used with:
   * - `.read.json`
   * - `.write.json`
   * - `.read.yaml`
   * - `.write.yaml`
   */
  public schema<NewSchema extends ZodSchema>(schema: NewSchema) {
    return new FsFile<TEncoding, NewSchema>(this._path, this._encoding, schema);
  }

  /**
   * @returns The path of the file
   */
  public valueOf(): AnyPath {
    return this._path;
  }

  public instanceOf(): FsFile<TEncoding, TSchema> {
    return this;
  }

  // #region sub actions

  /**
   * Access the read actions of the file
   */
  public get read() {
    return new FsFileRead<TEncoding, TSchema>(
      this._path,
      this._encoding,
      this._schema,
    );
  }

  /**
   * Access the write actions of the file
   */
  public get write() {
    return new FsFileWrite<TEncoding, TSchema>(
      this._path,
      this._encoding,
      "overwrite",
      this._schema,
    );
  }

  // #endregion

  // #region sync

  /**
   * @returns The absolute path of the file
   */
  public get path() {
    return this._path;
  }

  /**
   * @returns The absolute path of the directory containing the file
   */
  public dirPath() {
    // Todo: align function names
    return path.dirname(this._path);
  }

  /**
   * @returns An FsDir instance representing the directory containing the file
   */
  public dir() {
    return FsDir.cwd(this.dirPath());
  }

  /**
   * @returns The name of the file
   */
  public fileName() {
    return path.filename(this._path);
  }

  /**
   * @returns The extension of the file
   */
  public fileExtension() {
    return path.fileExtension(this._path);
  }

  /**
   * @returns The name of the file without the extension
   */
  public fileNameWithoutExtension() {
    return path.filenameWithoutExtension(this._path);
  }

  /**
   * @returns The mime type of the file or null if it cannot be determined
   */
  public mimeType() {
    return path.mimeType(this._path);
  }

  /**
   * Create a new FsFile instance with the provided relative path
   * @argument relativePath The relative path of the new file
   */
  public toFile(relativePath: string) {
    const newPath = path.resolve(this.dirPath(), relativePath);
    return new FsFile(newPath);
  }

  /**
   * Create a new FsDir instance with the provided relative path
   * @argument relativePath The relative path of the new directory
   */
  public toDir(relativePath: string) {
    const newPath = path.join(this.dirPath(), relativePath);
    return FsDir.cwd(newPath);
  }

  /**
   * Get the relative path from another file to this file
   *
   * ```ts
   * import { file } from "@synstack/fs";
   *
   * const file1 = file("/path/to/file1.txt");
   * const file2 = file("/path/to-other/file2.txt");
   *
   * console.log(file1.relativePathFrom(file2)); // ../to/file1.txt
   * ```
   */
  public relativePathFrom(dirOrFileOrPath: AnyPath | FsDir | FsFile) {
    return path.relative(path.dirname(dirOrFileOrPath.valueOf()), this.path);
  }

  /**
   * Get the relative path to go from this file to another
   *
   * ```ts
   * import { file } from "@synstack/fs";
   *
   * const file1 = file("/path/to/file1.txt");
   * const file2 = file("/path/to-other/file2.txt");
   *
   * console.log(file1.relativePathTo(file2)); // ../to-other/file2.txt
   * ```
   */
  public relativePathTo(dirOrFileOrPath: string | FsDir | FsFile) {
    return path.relative(this.dirPath(), dirOrFileOrPath.valueOf());
  }

  /**
   * Check if the file is in the provided directory
   */
  public isInDir(dirOrPath: AnyPath | FsDir) {
    return path.isInPath(dirOrPath.valueOf(), this._path.valueOf());
  }

  /**
   * Delete the file from the file system
   */
  public async rm(): Promise<void> {
    await fs.rm(this._path, { recursive: true });
  }

  /**
   * Delete the file from the file system
   * @synchronous
   */
  public rmSync(): void {
    fsSync.rmSync(this._path, { recursive: false });
  }

  /**
   * Check if the file exists
   */
  public async exists(): Promise<boolean> {
    try {
      await fs.access(this._path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if the file exists
   * @synchronous
   */
  public existsSync(): boolean {
    try {
      fsSync.accessSync(this._path);
      return true;
    } catch (error: any) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
  }

  /**
   * Get the creation date of the file as a Date object
   */
  public async creationDate(): Promise<Date> {
    const fileStats = await fs.stat(this._path);
    return fileStats.birthtime;
  }

  /**
   * Get the creation date of the file as a Date object
   * @synchronous
   */
  public creationDateSync(): Date {
    const stats = fsSync.statSync(this._path);
    return stats.birthtime;
  }

  /**
   * Check if the file matches any of the glob patterns
   */
  public matchesGlobs(...globs: Array<string> | [Array<string>]) {
    return glob.matches(this._path, ...globs);
  }

  /**
   * Capture parts of the file path using a glob pattern
   *
   * ```ts
   * import { file } from "@synstack/fs";
   *
   * const myFile = file("/my-domain/my-sub-domain/features/feature-name.controller.ts");
   * const res = myFile.globCapture("/(*)/(*)/features/(*).controller.ts");
   * if (!res) throw new Error("File doesn't match glob pattern");
   * console.log(res[1]); // my-domain
   * console.log(res[2]); // my-sub-domain
   * console.log(res[3]); // feature-name.controller.ts
   * ```
   */
  public globCapture(globPattern: string) {
    return glob.capture(globPattern, this._path);
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

  /**
   * @returns The content of the file as a string
   */
  public async text() {
    return fs.readFile(this._path, this._encoding);
  }

  /**
   * @returns The content of the file as a string
   * @synchronous
   */
  public textSync() {
    return fsSync.readFileSync(this._path, this._encoding);
  }

  /**
   * Used for further manipulation of the content
   * @returns The content of the file as a synstack/str instance
   */
  public async str() {
    return this.text().then(str);
  }

  /**
   * Used for further manipulation of the content
   * @returns The content of the file as a synstack/str instance
   * @synchronous
   */
  public strSync() {
    return str(this.textSync());
  }

  /**
   * @returns The content of the file as a JSON object
   * @info If a schema was provided to the file instanse, it will be used to validate the JSON
   */
  public async json<T = unknown>() {
    return this.text().then((t) =>
      json.deserialize<T>(t, { schema: this._schema }),
    );
  }

  /**
   * @returns The content of the file as a JSON object synchronously
   * @info If a schema was provided to the file instanse, it will be used to validate the JSON
   */
  public jsonSync<T = unknown>() {
    return json.deserialize<T>(this.textSync(), { schema: this._schema });
  }

  /**
   * @returns The YAML content of the file as a deserialized object
   * @info If a schema was provided to the file instanse, it will be used to validate the data
   */
  public async yaml<T = unknown>() {
    return this.text().then((t) =>
      yaml.deserialize<T>(t, { schema: this._schema }),
    );
  }

  /**
   * @returns The YAML content of the file as a deserialized object synchronously
   * @info If a schema was provided to the file instanse, it will be used to validate the data
   */
  public yamlSync<T = unknown>() {
    return yaml.deserialize<T>(this.textSync(), { schema: this._schema });
  }

  /**
   * Uses synstack/xml to parse the file content
   *
   * - Synstack XML is a non spec-compliant XML parser tailored for LLMs
   * - Check it's [documentation](https://github.com/pAIrprogio/synscript/tree/main/packages/xml) for more information
   */
  public async xml<T extends Array<Xml.Node>>() {
    return this.text().then(xml.parse<T>);
  }

  /**
   * Uses synstack/xml to parse the file content synchronously
   *
   * - Synstack XML is a non spec-compliant XML parser tailored for LLMs
   * - Check it's [documentation](https://github.com/pAIrprogio/synscript/tree/main/packages/xml) for more information
   */
  public xmlSync<T extends Array<Xml.Node>>() {
    return xml.parse<T>(this.textSync());
  }

  /**
   * @returns The content of the file as a base64 string
   */
  public async base64() {
    return fs.readFile(this._path, "base64");
  }

  /**
   * @returns The content of the file as a base64 string synchronously
   */
  public base64Sync() {
    return fsSync.readFileSync(this._path, "base64");
  }

  /**
   * @returns The content of the file as a synstack compatible Base64 data object
   */
  public async base64Data(
    defaultMimeType: string = "application/octet-stream",
  ) {
    return {
      type: "base64",
      data: await this.base64(),
      mimeType: defaultMimeType,
    } satisfies Base64Data;
  }

  /**
   * @returns The content of the file as a synstack compatible Base64 data object synchronously
   */
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
    mode: WriteMode = "overwrite",
    schema?: TSchema,
  ) {
    this._path = path;
    this._encoding = encoding;
    this._schema = schema;
    this._mode = mode;
  }

  /**
   * Set the write mode of the file
   * @argument preserve: If the file already exists, it will be left untouched
   * @argument overwrite: If the file already exists, it will be overwritten
   */
  public mode<NewWriteMode extends WriteMode>(writeMode: NewWriteMode) {
    return new FsFileWrite(this._path, this._encoding, writeMode, this._schema);
  }

  /**
   * Write text to the file
   */
  public async text(content: Stringable): Promise<void> {
    if (this._mode === "preserve" && (await FsFile.from(this._path).exists()))
      return;
    const dirname = path.dirname(this._path);
    await fs.mkdir(dirname, { recursive: true });
    await fs.writeFile(this._path, content.toString(), this._encoding);
  }

  /**
   * Write text to the file synchronously
   */
  public textSync(content: Stringable): void {
    if (this._mode === "preserve" && FsFile.from(this._path).existsSync())
      return;
    const dirname = path.dirname(this._path);
    fsSync.mkdirSync(dirname, { recursive: true });
    fsSync.writeFileSync(this._path, content.toString(), this._encoding);
  }

  /**
   * Write JSON to the file
   * @argument data The data to write, can be any JSON-serializable value
   */
  public async json<T>(data: T): Promise<void> {
    return this.text(json.serialize(data, { schema: this._schema }));
  }

  /**
   * Write pretty JSON to the file
   * @argument data The data to write, can be any JSON-serializable value
   */
  public async prettyJson<T>(data: T): Promise<void> {
    return this.text(
      json.serialize(data, { schema: this._schema, pretty: true }) + "\n",
    );
  }

  /**
   * Write JSON to the file
   * @argument data: The data to write, can be any JSON-serializable value
   * @info If a schema was provided to the file instanse, it will be used to validate the data before writing
   * @synchronous
   */
  public jsonSync<T>(data: T): void {
    return this.textSync(json.serialize(data, { schema: this._schema }));
  }

  /**
   * Write pretty JSON to the file
   * @argument data: The data to write, can be any JSON-serializable value
   * @info If a schema was provided to the file instanse, it will be used to validate the data before writing
   * @synchronous
   */
  public prettyJsonSync<T>(data: T): void {
    return this.textSync(
      json.serialize(data, { schema: this._schema, pretty: true }) + "\n",
    );
  }

  /**
   * Write YAML to the file
   * @argument data The data to write, can be any JSON-serializable value
   * @info If a schema was provided to the file instanse, it will be used to validate the data
   */
  public async yaml<T>(data: T): Promise<void> {
    return this.text(yaml.serialize(data, { schema: this._schema }));
  }

  /**
   * Write YAML to the file
   * @argument data The data to write, can be any JSON-serializable value
   * @info If a schema was provided to the file instanse, it will be used to validate the data
   * @synchronous
   */
  public yamlSync<T>(data: T): void {
    return this.textSync(yaml.serialize(data, { schema: this._schema }));
  }

  /**
   * Write Base64 to the file
   * @argument data The data to write, needs to be a base64 string
   */
  public async base64(data: Stringable): Promise<void> {
    if (this._mode === "preserve" && (await FsFile.from(this._path).exists()))
      return;
    const dirname = path.dirname(this._path);
    await fs.mkdir(dirname, { recursive: true });
    await fs.writeFile(this._path, data.toString(), "base64");
  }

  /**
   * Write Base64 to the file
   * @argument data The data to write, needs to be a base64 string
   * @synchronous
   */
  public base64Sync(data: Stringable): void {
    if (this._mode === "preserve" && FsFile.from(this._path).existsSync())
      return;
    const dirname = path.dirname(this._path);
    fsSync.mkdirSync(dirname, { recursive: true });
    return fsSync.writeFileSync(this._path, data.toString(), "base64");
  }
}

/**
 * Creates a new FsFile instance with the provided path
 */
export const file = FsFile.from;
