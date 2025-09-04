import { glob } from "@synstack/glob";
import { json } from "@synstack/json";
import { MdDoc } from "@synstack/markdown";
import { type AnyPath, path } from "@synstack/path";
import { Pipeable } from "@synstack/pipe";
import { str } from "@synstack/str";
import { type Xml, xml } from "@synstack/xml";
import { yaml } from "@synstack/yaml";
import * as fsSync from "fs";
import * as fs from "fs/promises";
import type { ZodTypeDef as ZodTypeDefV3, ZodType as ZodTypeV3 } from "zod/v3";
import type { ZodType as ZodTypeV4 } from "zod/v4";
import { type Stringable } from "../../shared/src/ts.utils.ts";
import { FsDir } from "./dir.lib.ts";

// Union type to support both Zod v3 and v4 schemas
type ZodSchema<OUT = any, IN = any> =
  | ZodTypeV3<OUT, ZodTypeDefV3, IN>
  | ZodTypeV4<OUT, IN>;

type TextEncoding = Exclude<BufferEncoding, "buffer">;
type WriteMode = "preserve" | "overwrite";

export interface Base64Data {
  type: "base64";
  data: string;
  mimeType: string;
}

/**
 * A strongly-typed, chainable API for file system operations.
 * Provides methods for reading, writing, and manipulating files with support for multiple formats.
 *
 * @typeParam TEncoding - The text encoding to use for file operations (default: 'utf-8')
 * @typeParam TSchema - Optional Zod schema for validating JSON/YAML data
 *
 * ```typescript
 * import { fsFile } from "@synstack/fs";
 *
 * // Create a file instance
 * const configFile = fsFile("./config.json")
 *   .schema(ConfigSchema)
 *   .read.json();
 *
 * // Write text with different encodings
 * const logFile = fsFile("./log.txt")
 *   .write.text("Hello World");
 * ```
 */
export class FsFile<
  TEncoding extends TextEncoding = "utf-8",
  TSchema extends ZodSchema | undefined = undefined,
> extends Pipeable<FsFile<TEncoding, TSchema>, AnyPath> {
  private readonly _path: AnyPath;
  private readonly _encoding: TEncoding;
  private readonly _schema?: TSchema;

  /**
   * Create a new FsFile instance from a path, a list of paths to be resolved, or an existing FsFile instance.
   * The resulting path will be an absolute path.
   *
   * @param paths - A path or an existing FsFile instance
   * @returns A new FsFile instance with UTF-8 encoding
   *
   * ```typescript
   * import { fsFile } from "@synstack/fs";
   *
   * const relativeFile = fsFile("./relative/path.txt");
   * const existingFile = fsFile(fsFile("/path/to/existing.txt"));
   * ```
   */
  public static from(this: void, arg: FsFile | AnyPath) {
    if (arg instanceof FsFile) return arg;
    return new FsFile<"utf-8", undefined>(path.resolve(arg), "utf-8");
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
  /**
   * Provide a validation schema for JSON/YAML operations.
   * The schema will be used to validate data when reading or writing JSON/YAML files.
   *
   * @typeParam NewSchema - The Zod schema type for validation
   * @param schema - A Zod schema to validate JSON/YAML data
   * @returns A new FsFile instance with the schema attached
   *
   * ```typescript
   * import { fsFile } from "@synstack/fs";
   * import { z } from "zod";
   *
   * const ConfigSchema = z.object({
   *   port: z.number(),
   *   host: z.string()
   * });
   *
   * const config = await fsFile("config.json")
   *   .schema(ConfigSchema)
   *   .read.json();
   * // config is typed as { port: number, host: string }
   * ```
   */
  public schema<NewSchema extends ZodSchema>(schema: NewSchema) {
    return new FsFile<TEncoding, NewSchema>(this._path, this._encoding, schema);
  }

  /**
   * Get the path of the file.
   *
   * @returns The absolute path of the file
   */
  public valueOf(): AnyPath {
    return this._path;
  }

  /**
   * Get the current instance of the file.
   * Used for type compatibility with Pipeable.
   *
   * @returns The current FsFile instance
   */
  public instanceOf(): FsFile<TEncoding, TSchema> {
    return this;
  }

  // #region sub actions

  /**
   * Access the read operations for the file.
   * Provides methods for reading file contents in various formats.
   *
   * @returns An FsFileRead instance with methods for reading the file
   *
   * ```typescript
   * const content = await fsFile("data.txt").read.text();
   * const json = await fsFile("config.json").read.json();
   * const yaml = await fsFile("config.yml").read.yaml();
   * ```
   */
  public get read() {
    return new FsFileRead<TEncoding, TSchema>(
      this._path,
      this._encoding,
      this._schema,
    );
  }

  /**
   * Access the write operations for the file.
   * Provides methods for writing content to the file in various formats.
   *
   * @returns An FsFileWrite instance with methods for writing to the file
   *
   * ```typescript
   * await fsFile("data.txt").write.text("Hello");
   * await fsFile("config.json").write.json({ hello: "world" });
   * await fsFile("config.yml").write.yaml({ config: true });
   * ```
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
   * Get the absolute path of the file.
   *
   * @returns The absolute path as a string
   */
  public get path() {
    return this._path;
  }

  /**
   * Get the absolute path of the directory containing the file.
   *
   * @returns The directory path as a string
   */
  public dirPath() {
    return path.dirname(this._path);
  }

  /**
   * Get an FsDir instance representing the directory containing the file.
   *
   * @returns An FsDir instance for the parent directory
   *
   * ```typescript
   * const file = fsFile("/path/to/file.txt");
   * const parentDir = file.dir(); // FsDir for "/path/to"
   * ```
   */
  public dir() {
    return FsDir.cwd(this.dirPath());
  }

  /**
   * Get the name of the file including its extension.
   *
   * @returns The file name with extension
   *
   * ```typescript
   * const file = fsFile("/path/to/document.txt");
   * console.log(file.fileName()); // "document.txt"
   * ```
   */
  public fileName() {
    return path.filename(this._path);
  }

  /**
   * Get the extension of the file.
   *
   * @returns The file extension including the dot (e.g., ".txt")
   *
   * ```typescript
   * const file = fsFile("/path/to/document.txt");
   * console.log(file.fileExtension()); // ".txt"
   * ```
   */
  public fileExtension() {
    return path.fileExtension(this._path);
  }

  /**
   * Get the name of the file without its extension.
   *
   * @returns The file name without extension
   *
   * ```typescript
   * const file = fsFile("/path/to/document.txt");
   * console.log(file.fileNameWithoutExtension()); // "document"
   * ```
   */
  public fileNameWithoutExtension() {
    return path.filenameWithoutExtension(this._path);
  }

  /**
   * Get the MIME type of the file based on its extension.
   *
   * @returns The MIME type string or null if it cannot be determined
   *
   * ```typescript
   * const file = fsFile("/path/to/image.png");
   * console.log(file.mimeType()); // "image/png"
   * ```
   */
  public mimeType() {
    return path.mimeType(this._path);
  }

  /**
   * Create a new FsFile instance with a path relative to this file's directory.
   *
   * @param relativePath - The relative path from this file's directory
   * @returns A new FsFile instance for the target path
   *
   * ```typescript
   * import { fsFile } from "@synstack/fs";
   *
   * const sourceFile = fsFile("/path/to/source.txt");
   * const targetFile = sourceFile.toFile("../output/target.txt");
   * // targetFile.path === "/path/output/target.txt"
   * ```
   */
  public toFile(relativePath: string) {
    const newPath = path.resolve(this.dirPath(), relativePath);
    return new FsFile(newPath);
  }

  /**
   * Create a new FsDir instance with a path relative to this file's directory.
   *
   * @param relativePath - The relative path from this file's directory
   * @returns A new FsDir instance for the target directory
   *
   * ```typescript
   * import { fsFile } from "@synstack/fs";
   *
   * const sourceFile = fsFile("/path/to/source.txt");
   * const outputDir = sourceFile.toDir("../output");
   * // outputDir.path === "/path/output"
   * ```
   */
  public toDir(relativePath: string) {
    const newPath = path.join(this.dirPath(), relativePath);
    return FsDir.cwd(newPath);
  }

  /**
   * Get the relative path from another file to this file
   *
   * ```ts
   * import { fsFile } from "@synstack/fs";
   *
   * const file1 = fsFile("/path/to/file1.txt");
   * const file2 = fsFile("/path/to-other/file2.txt");
   *
   * console.log(file1.relativePathFrom(file2)); // ../to/file1.txt
   * ```
   */
  public relativePathFrom(dirOrFile: FsDir | FsFile): string {
    if (dirOrFile instanceof FsFile)
      return this.relativePathFrom(dirOrFile.dir());
    return path.relative(dirOrFile.path, this.path);
  }

  /**
   * Get the relative path to go from this file to another
   *
   * ```ts
   * import { fsFile } from "@synstack/fs";
   *
   * const file1 = fsFile("/path/to/file1.txt");
   * const file2 = fsFile("/path/to-other/file2.txt");
   *
   * console.log(file1.relativePathTo(file2)); // ../to-other/file2.txt
   * ```
   */
  public relativePathTo(dirOrFileOrPath: FsDir | FsFile): string {
    return path.relative(this.dirPath(), dirOrFileOrPath.path);
  }

  /**
   * Check if the file is located within the specified directory.
   *
   * @param dirOrPath - The directory or path to check against
   * @returns True if the file is in the directory, false otherwise
   *
   * ```typescript
   * import { fsFile, fsDir } from "@synstack/fs";
   *
   * const sourceFile = fsFile("/path/to/file.txt");
   * console.log(sourceFile.isInDir(fsDir("/path"))); // true
   * console.log(sourceFile.isInDir(fsDir("/other"))); // false
   * ```
   */
  public isInDir(dirOrPath: AnyPath | FsDir) {
    return path.isInPath(dirOrPath.valueOf(), this._path.valueOf());
  }

  /**
   * Delete the file from the file system.
   * If the file doesn't exist, the operation is silently ignored.
   *
   * @returns A promise that resolves when the file is deleted
   *
   * ```typescript
   * import { fsFile } from "@synstack/fs";
   *
   * const tempFile = fsFile("./temp.txt");
   * await tempFile.write.text("temporary content");
   * await tempFile.remove(); // File is deleted
   * ```
   */
  public async remove(): Promise<void> {
    await fs.rm(this._path, { recursive: true }).catch((e) => {
      if (e.code === "ENOENT") return;
      throw e;
    });
  }

  /**
   * @deprecated Use {@link remove} instead.
   */
  public rm(): Promise<void> {
    return this.remove();
  }

  /**
   * Delete the file from the file system synchronously.
   * If the file doesn't exist, the operation is silently ignored.
   *
   * @synchronous
   *
   * ```typescript
   * import { fsFile } from "@synstack/fs";
   *
   * const tempFile = fsFile("./temp.txt");
   * tempFile.write.textSync("temporary content");
   * tempFile.removeSync(); // File is deleted immediately
   * ```
   */
  public removeSync(): void {
    try {
      fsSync.rmSync(this._path, { recursive: false });
    } catch (error: any) {
      if (error.code === "ENOENT") return;
      throw error;
    }
  }

  /**
   * @deprecated Use {@link removeSync} instead.
   */
  public rmSync(): void {
    this.removeSync();
  }

  /**
   * Move the file to a new location.
   *
   * @param newPath - The new path for the file or an existing FsFile instance
   * @returns A promise that resolves the new file
   */
  public async move(newPath: FsFile | AnyPath): Promise<FsFile> {
    const newFile = FsFile.from(newPath);
    await fs.rename(this._path, newFile.path);
    return newFile;
  }

  /**
   * Move the file to a new location synchronously.
   *
   * @param newPath - The new path for the file or an existing FsFile instance
   * @returns The new file
   */
  public moveSync(newPath: FsFile | AnyPath): FsFile {
    const newFile = FsFile.from(newPath);
    fsSync.renameSync(this._path, newFile.path);
    return newFile;
  }

  /**
   * Check if the file exists in the file system.
   *
   * @returns A promise that resolves to true if the file exists, false otherwise
   *
   * ```typescript
   * import { fsFile } from "@synstack/fs";
   *
   * const configFile = fsFile("./config.json");
   * if (await configFile.exists()) {
   *   const config = await configFile.read.json();
   * }
   * ```
   */
  public async exists(): Promise<boolean> {
    return fs
      .access(this._path, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Check if the file exists in the file system synchronously.
   *
   * @synchronous
   * @returns True if the file exists, false otherwise
   *
   * ```typescript
   * import { fsFile } from "@synstack/fs";
   *
   * const configFile = fsFile("./config.json");
   * if (configFile.existsSync()) {
   *   const config = configFile.read.jsonSync();
   * }
   * ```
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
   * Get the creation date of the file.
   *
   * @returns A promise that resolves to the file's creation date
   * @throws If the file doesn't exist or cannot be accessed
   *
   * ```typescript
   * import { fsFile } from "@synstack/fs";
   *
   * const sourceFile = fsFile("./source.txt");
   * const created = await sourceFile.creationDate();
   * console.log(`File created on: ${created.toISOString()}`);
   * ```
   */
  public async creationDate(): Promise<Date> {
    const fileStats = await fs.stat(this._path);
    return fileStats.birthtime;
  }

  /**
   * Get the creation date of the file synchronously.
   *
   * @synchronous
   * @returns The file's creation date
   * @throws If the file doesn't exist or cannot be accessed
   *
   * ```typescript
   * import { fsFile } from "@synstack/fs";
   *
   * const sourceFile = fsFile("./source.txt");
   * const created = sourceFile.creationDateSync();
   * console.log(`File created on: ${created.toISOString()}`);
   * ```
   */
  public creationDateSync(): Date {
    const stats = fsSync.statSync(this._path);
    return stats.birthtime;
  }

  /**
   * Check if the file path matches any of the provided glob patterns.
   *
   * @param globs - One or more glob patterns to match against, either as separate arguments or an array
   * @returns True if the file matches any pattern, false otherwise
   *
   * ```typescript
   * import { fsFile } from "@synstack/fs";
   *
   * const sourceFile = fsFile("./src/components/Button.tsx");
   * console.log(sourceFile.matchesGlobs("**\/*.tsx")); // true
   * console.log(sourceFile.matchesGlobs(["*.css", "*.html"])); // false
   * console.log(sourceFile.matchesGlobs("**\/*.ts", "**\/*.tsx")); // true
   * ```
   */
  public matchesGlobs(...globs: Array<string> | [Array<string>]) {
    return glob.matches(this._path, ...globs);
  }

  /**
   * Capture parts of the file path using a glob pattern
   *
   * ```ts
   * import { fsFile } from "@synstack/fs";
   *
   * const myFile = fsFile("/my-domain/my-sub-domain/features/feature-name.controller.ts");
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
  ENCODING extends TextEncoding = "utf-8",
  SCHEMA extends ZodSchema | undefined = undefined,
> {
  private readonly _path: AnyPath;
  private readonly _encoding: ENCODING;
  private readonly _schema?: SCHEMA;

  public constructor(path: AnyPath, encoding: ENCODING, schema?: SCHEMA) {
    this._path = path;
    this._encoding = encoding;
    this._schema = schema;
  }

  public get path() {
    return this._path;
  }

  // #region sync

  /**
   * Read the file contents as a string.
   *
   * @returns A promise that resolves to the file contents as a string
   * @throws If the file doesn't exist or cannot be read
   *
   * ```typescript
   * const content = await fsFile("data.txt").read.text();
   * console.log(content); // "Hello, World!"
   * ```
   */
  public async text() {
    return fs.readFile(this._path, this._encoding);
  }

  /**
   * Read the file contents as a string synchronously.
   *
   * @synchronous
   * @returns The file contents as a string
   * @throws If the file doesn't exist or cannot be read
   *
   * ```typescript
   * const content = fsFile("data.txt").read.textSync();
   * console.log(content); // "Hello, World!"
   * ```
   */
  public textSync() {
    return fsSync.readFileSync(this._path, this._encoding);
  }

  /**
   * Read the file contents and return a chainable string instance.
   * Used for further manipulation of the content using @synstack/str methods.
   *
   * @returns A promise that resolves to a chainable string instance
   * @throws If the file doesn't exist or cannot be read
   *
   * ```typescript
   * const content = await fsFile("data.txt").read.str();
   * const lines = content
   *   .split("\n")
   *   .filter((line) => line.trim().length > 0);
   * ```
   */
  public async str() {
    return this.text().then(str);
  }

  /**
   * Read the file contents and return a chainable string instance synchronously.
   * Used for further manipulation of the content using @synstack/str methods.
   *
   * @synchronous
   * @returns A chainable string instance
   * @throws If the file doesn't exist or cannot be read
   *
   * ```typescript
   * const content = fsFile("data.txt").read.strSync();
   * const lines = content
   *   .split("\n")
   *   .filter((line) => line.trim().length > 0);
   * ```
   */
  public strSync() {
    return str(this.textSync());
  }

  /**
   * Read and parse the file contents as JSON.
   * If a schema is provided, the parsed data will be validated against it.
   *
   * @returns A promise that resolves to the parsed JSON data
   * @throws If the file doesn't exist, cannot be read, or contains invalid JSON
   * @throws If schema validation fails when a schema is provided
   *
   * ```typescript
   * interface Config {
   *   port: number;
   *   host: string;
   * }
   *
   * const config = await fsFile("config.json")
   *   .schema(ConfigSchema)
   *   .read.json();
   * // config is automatically typed as the schema's output type
   * ```
   */
  public json<
    OUT = SCHEMA extends ZodSchema<infer O> ? O : unknown,
  >(): Promise<OUT> {
    return this.text().then((t) =>
      json.deserialize(t, { schema: this._schema }),
    );
  }

  /**
   * Read and parse the file contents as JSON synchronously.
   * If a schema is provided, the parsed data will be validated against it.
   *
   * @synchronous
   * @returns The parsed JSON data
   * @throws If the file doesn't exist, cannot be read, or contains invalid JSON
   * @throws If schema validation fails when a schema is provided
   *
   * ```typescript
   * const config = fsFile("config.json")
   *   .schema(ConfigSchema)
   *   .read.jsonSync();
   * // config is automatically typed as the schema's output type
   * ```
   */
  public jsonSync<
    OUT = SCHEMA extends ZodSchema<infer O> ? O : unknown,
  >(): OUT {
    return json.deserialize(this.textSync(), {
      schema: this._schema,
    });
  }

  /**
   * Read and parse the file contents as YAML.
   * If a schema is provided, the parsed data will be validated against it.
   *
   * @typeParam T - The type of the parsed YAML data
   * @returns A promise that resolves to the parsed YAML data
   * @throws If the file doesn't exist, cannot be read, or contains invalid YAML
   * @throws If schema validation fails when a schema is provided
   *
   * ```typescript
   * interface Config {
   *   environment: string;
   *   settings: Record<string, unknown>;
   * }
   *
   * const config = await fsFile("config.yml")
   *   .schema(ConfigSchema)
   *   .read.yaml();
   * // config is automatically typed as the schema's output type
   * ```
   */
  public yaml<
    OUT = SCHEMA extends ZodSchema<infer O> ? O : unknown,
  >(): Promise<OUT> {
    return this.text().then((t) =>
      yaml.deserialize(t, { schema: this._schema }),
    );
  }

  /**
   * Read and parse the file contents as YAML synchronously.
   * If a schema is provided, the parsed data will be validated against it.
   *
   * @typeParam T - The type of the parsed YAML data
   * @synchronous
   * @returns The parsed YAML data
   * @throws If the file doesn't exist, cannot be read, or contains invalid YAML
   * @throws If schema validation fails when a schema is provided
   *
   * ```typescript
   * const config = fsFile("config.yml")
   *   .schema(ConfigSchema)
   *   .read.yamlSync();
   * // config is automatically typed as the schema's output type
   * ```
   */
  public yamlSync<
    OUT = SCHEMA extends ZodSchema<infer O> ? O : unknown,
  >(): OUT {
    return yaml.deserialize(this.textSync(), {
      schema: this._schema,
    });
  }

  /**
   * Read and parse the file contents as XML using @synstack/xml.
   * This parser is specifically designed for LLM-related XML processing.
   *
   * @typeParam T - The type of the parsed XML nodes array, must extend Array<Xml.Node>
   * @returns A promise that resolves to the parsed XML nodes
   * @throws If the file doesn't exist, cannot be read, or contains invalid XML
   * @see {@link https://github.com/pAIrprogio/synscript/tree/main/packages/xml|@synstack/xml documentation}
   *
   * ```typescript
   * interface XmlNode {
   *   tag: string;
   *   attributes: Record<string, string>;
   *   children: Array<XmlNode>;
   * }
   *
   * const nodes = await fsFile("data.xml").read.xml<XmlNode[]>();
   * console.log(nodes[0].tag); // "root"
   * console.log(nodes[0].attributes.id); // "main"
   * ```
   *
   * @remarks
   * - Uses a non-spec-compliant XML parser tailored for LLM use cases
   * - Optimized for simple XML structures commonly used in LLM responses
   * - Does not support all XML features (see documentation for details)
   */
  public async xml<T extends Array<Xml.Node>>(): Promise<T> {
    return this.text().then((content) => xml.parse<T>(content));
  }

  /**
   * Read and parse the file contents as XML synchronously using @synstack/xml.
   * This parser is specifically designed for LLM-related XML processing.
   *
   * @typeParam T - The type of the parsed XML nodes array, must extend Array<Xml.Node>
   * @synchronous
   * @returns The parsed XML nodes
   * @throws If the file doesn't exist, cannot be read, or contains invalid XML
   * @see {@link https://github.com/pAIrprogio/synscript/tree/main/packages/xml|@synstack/xml documentation}
   *
   * ```typescript
   * const nodes = fsFile("data.xml").read.xmlSync<XmlNode[]>();
   * console.log(nodes[0].tag); // "root"
   * console.log(nodes[0].attributes.id); // "main"
   * ```
   *
   * @remarks
   * - Uses a non-spec-compliant XML parser tailored for LLM use cases
   * - Optimized for simple XML structures commonly used in LLM responses
   * - Does not support all XML features (see documentation for details)
   */
  public xmlSync<T extends Array<Xml.Node>>(): T {
    return xml.parse<T>(this.textSync());
  }

  /**
   * Read the file contents and encode them as a base64 string.
   * Useful for handling binary data or preparing content for data URLs.
   *
   * @returns A promise that resolves to the file contents as a base64-encoded string
   * @throws If the file doesn't exist or cannot be read
   *
   * ```typescript
   * // Read and encode an image file
   * const imageBase64 = await fsFile("image.png").read.base64();
   * console.log(imageBase64); // "iVBORw0KGgoAAAANSUhEUgAA..."
   *
   * // Create a data URL for use in HTML/CSS
   * const dataUrl = `data:image/png;base64,${imageBase64}`;
   * ```
   */
  public async base64(): Promise<string> {
    return fs.readFile(this._path, "base64");
  }

  /**
   * Read the file contents and encode them as a base64 string synchronously.
   * Useful for handling binary data or preparing content for data URLs.
   *
   * @synchronous
   * @returns The file contents as a base64-encoded string
   * @throws If the file doesn't exist or cannot be read
   *
   * ```typescript
   * const imageBase64 = fsFile("image.png").read.base64Sync();
   * const dataUrl = `data:image/png;base64,${imageBase64}`;
   * ```
   */
  public base64Sync(): string {
    return fsSync.readFileSync(this._path, "base64");
  }

  /**
   * Read the file contents and create a synstack-compatible Base64Data object.
   * This format includes MIME type information along with the base64-encoded data.
   *
   * @param defaultMimeType - The MIME type to use if it cannot be determined from the file extension
   * @returns A promise that resolves to a Base64Data object containing the encoded content and MIME type
   * @throws If the file doesn't exist or cannot be read
   *
   * ```typescript
   * // Read an image with automatic MIME type detection
   * const imageData = await fsFile("image.png").read.base64Data();
   * console.log(imageData);
   * // {
   * //   type: "base64",
   * //   data: "iVBORw0KGgoAAAANSUhEUgAA...",
   * //   mimeType: "image/png"
   * // }
   *
   * // Specify a custom MIME type for a binary file
   * const data = await fsFile("custom.bin")
   *   .read.base64Data("application/custom");
   * ```
   */
  public async base64Data(
    defaultMimeType: string = "application/octet-stream",
  ): Promise<Base64Data> {
    return {
      type: "base64",
      data: await this.base64(),
      mimeType: defaultMimeType,
    } satisfies Base64Data;
  }

  /**
   * Read the file contents and create a synstack-compatible Base64Data object synchronously.
   * This format includes MIME type information along with the base64-encoded data.
   *
   * @param defaultMimeType - The MIME type to use if it cannot be determined from the file extension
   * @synchronous
   * @returns A Base64Data object containing the encoded content and MIME type
   * @throws If the file doesn't exist or cannot be read
   *
   * ```typescript
   * const imageData = fsFile("image.png").read.base64DataSync();
   * console.log(imageData);
   * // {
   * //   type: "base64",
   * //   data: "iVBORw0KGgoAAAANSUhEUgAA...",
   * //   mimeType: "image/png"
   * // }
   * ```
   */
  public base64DataSync(
    defaultMimeType: string = "application/octet-stream",
  ): Base64Data {
    return {
      type: "base64",
      data: this.base64Sync(),
      mimeType: defaultMimeType,
    } satisfies Base64Data;
  }

  /**
   * Read the file contents and parse them as a markdown document.
   * If a schema is provided, the header data will be validated before returning.
   *
   * @returns A promise that resolves to the markdown document
   * @throws If the file doesn't exist, cannot be read, or contains invalid markdown
   * @throws If schema validation fails when a schema is provided
   */
  public md<DATA_SHAPE = SCHEMA extends ZodSchema<infer O> ? O : unknown>() {
    return this.text().then((t) =>
      MdDoc.withOptions<DATA_SHAPE>({
        schema: this._schema,
      }).fromString(t),
    );
  }

  /**
   * Read the file contents and parse them as a markdown document synchronously.
   * If a schema is provided, the header data will be validated before returning.
   *
   * @synchronous
   * @returns The markdown document
   * @throws If the file doesn't exist, cannot be read, or contains invalid markdown
   * @throws If schema validation fails when a schema is provided
   */
  public mdSync<
    DATA_SHAPE = SCHEMA extends ZodSchema<infer O> ? O : unknown,
  >() {
    return MdDoc.withOptions<DATA_SHAPE>({
      schema: this._schema,
    }).fromString(this.textSync());
  }
}

// Todo: Passing absolute paths will break the cache, find a way to fix this
class FsFileWrite<
  TEncoding extends TextEncoding,
  TSchema extends ZodSchema | undefined = undefined,
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
   * Write text content to a file asynchronously.
   * Creates parent directories if they don't exist.
   * Respects the write mode (overwrite/preserve) setting.
   *
   * @param content - The content to write, will be converted to string using toString()
   * @returns A promise that resolves when the write operation is complete
   * @throws If the write operation fails or if parent directory creation fails
   */
  public async text(content: Stringable): Promise<void> {
    if (this._mode === "preserve" && (await FsFile.from(this._path).exists()))
      return;
    const dirname = path.dirname(this._path);
    await fs.mkdir(dirname, { recursive: true });
    await fs.writeFile(this._path, content.toString(), this._encoding);
  }

  /**
   * Write text content to a file synchronously.
   * Creates parent directories if they don't exist.
   * Respects the write mode (overwrite/preserve) setting.
   *
   * @param content - The content to write, will be converted to string using toString()
   * @synchronous
   * @throws If the write operation fails or if parent directory creation fails
   */
  public textSync(content: Stringable): void {
    if (this._mode === "preserve" && FsFile.from(this._path).existsSync())
      return;
    const dirname = path.dirname(this._path);
    fsSync.mkdirSync(dirname, { recursive: true });
    fsSync.writeFileSync(this._path, content.toString(), this._encoding);
  }

  /**
   * Write data as JSON to a file asynchronously.
   * The data will be serialized using JSON.stringify.
   * If a schema is provided, the data will be validated before writing.
   *
   * @typeParam T - The type of data being written
   * @param data - The data to write, must be JSON-serializable
   * @returns A promise that resolves when the write operation is complete
   * @throws If schema validation fails or if the write operation fails
   */
  public async json<T>(
    data: TSchema extends ZodSchema<infer O> ? O : T,
  ): Promise<void> {
    return this.text(json.serialize(data, { schema: this._schema }));
  }

  // Todo: add mergeJson

  /**
   * Write data as formatted JSON to a file asynchronously.
   * The data will be serialized using JSON.stringify with pretty printing.
   * If a schema is provided, the data will be validated before writing.
   *
   * @typeParam T - The type of data being written
   * @param data - The data to write, must be JSON-serializable
   * @returns A promise that resolves when the write operation is complete
   * @throws If schema validation fails or if the write operation fails
   */
  public async prettyJson<T>(
    data: TSchema extends ZodSchema<infer O> ? O : T,
  ): Promise<void> {
    return this.text(
      json.serialize(data, { schema: this._schema, pretty: true }) + "\n",
    );
  }

  /**
   * Write data as JSON to a file synchronously.
   * The data will be serialized using JSON.stringify.
   * If a schema is provided, the data will be validated before writing.
   *
   * @typeParam T - The type of data being written
   * @param data - The data to write, must be JSON-serializable
   * @synchronous
   * @throws If schema validation fails or if the write operation fails
   */
  public jsonSync<T>(data: TSchema extends ZodSchema<infer O> ? O : T): void {
    return this.textSync(json.serialize(data, { schema: this._schema }));
  }

  /**
   * Write data as formatted JSON to a file synchronously.
   * The data will be serialized using JSON.stringify with pretty printing.
   * If a schema is provided, the data will be validated before writing.
   *
   * @typeParam T - The type of data being written
   * @param data - The data to write, must be JSON-serializable
   * @synchronous
   * @throws If schema validation fails or if the write operation fails
   */
  public prettyJsonSync<T = unknown>(
    data: TSchema extends ZodSchema<infer O> ? O : T,
  ): void {
    return this.textSync(
      json.serialize(data, { schema: this._schema, pretty: true }) + "\n",
    );
  }

  /**
   * Write data as YAML to a file asynchronously.
   * The data will be serialized using YAML.stringify.
   * If a schema is provided, the data will be validated before writing.
   *
   * @typeParam T - The type of data being written
   * @param data - The data to write, must be YAML-serializable
   * @throws If schema validation fails or if the write operation fails
   */
  public async yaml<T = unknown>(
    data: TSchema extends ZodSchema<infer O> ? O : T,
  ): Promise<void> {
    return this.text(yaml.serialize(data, { schema: this._schema }));
  }

  /**
   * Write data as YAML to a file synchronously.
   * The data will be serialized using YAML.stringify.
   * If a schema is provided, the data will be validated before writing.
   *
   * @typeParam T - The type of data being written
   * @param data - The data to write, must be YAML-serializable
   * @synchronous
   * @throws If schema validation fails or if the write operation fails
   */
  public yamlSync<T = unknown>(
    data: TSchema extends ZodSchema<infer O> ? O : T,
  ): void {
    return this.textSync(yaml.serialize(data, { schema: this._schema }));
  }

  /**
   * Write base64-encoded data to a file asynchronously.
   * Creates parent directories if they don't exist.
   * Respects the write mode (overwrite/preserve) setting.
   *
   * @param data - The base64-encoded string to write
   * @throws If the write operation fails or if parent directory creation fails
   */
  public async base64(data: Stringable): Promise<void> {
    if (this._mode === "preserve" && (await FsFile.from(this._path).exists()))
      return;
    const dirname = path.dirname(this._path);
    await fs.mkdir(dirname, { recursive: true });
    await fs.writeFile(this._path, data.toString(), "base64");
  }

  /**
   * Write base64-encoded data to a file synchronously.
   * Creates parent directories if they don't exist.
   * Respects the write mode (overwrite/preserve) setting.
   *
   * @param data - The base64-encoded string to write
   * @synchronous
   * @throws If the write operation fails or if parent directory creation fails
   */
  public base64Sync(data: Stringable): void {
    if (this._mode === "preserve" && FsFile.from(this._path).existsSync())
      return;
    const dirname = path.dirname(this._path);
    fsSync.mkdirSync(dirname, { recursive: true });
    return fsSync.writeFileSync(this._path, data.toString(), "base64");
  }

  /**
   * Write a markdown document to a file asynchronously.
   * The markdown document will be serialized using MdDoc.toMd.
   * If a schema is provided, the data will be validated before writing.
   *
   * @param data - The markdown document to write
   * @throws If schema validation fails or if the write operation fails
   */
  public md(data: MdDoc) {
    return this.text(data.toMd());
  }

  /**
   * Write a markdown document to a file synchronously.
   * The markdown document will be serialized using MdDoc.toMd.
   * If a schema is provided, the data will be validated before writing.
   *
   * @param data - The markdown document to write
   * @throws If schema validation fails or if the write operation fails
   * @synchronous
   */
  public mdSync(data: MdDoc) {
    return this.textSync(data.toMd());
  }
}

/**
 * Create a new FsFile instance from a path, a list of paths to be resolved, or an existing FsFile instance.
 * The resulting path will be an absolute path.
 *
 * @param args - One or more path segments to join into a file path, or an existing FsFile instance
 * @returns A new FsFile instance with UTF-8 encoding
 *
 * ```typescript
 * import { fsFile } from "@synstack/fs";
 *
 * const relativeFile = fsFile("./relative/path.txt");
 * const existingFile = fsFile(fsFile("/path/to/existing.txt"));
 * ```
 */
export const fsFile = FsFile.from;

/**
 * @deprecated Changed to avoid namespacing conflicts. Use {@link fsFile} instead
 */
export const file = FsFile.from;
