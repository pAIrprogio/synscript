import { FsFile, fsFile } from "@synstack/fs";
import { t } from "@synstack/text";
import kuzu, { type Connection, type Database } from "kuzu";

export class KuzuClient {
  private readonly dbPath: FsFile | string;
  private readonly db: Database;
  private readonly conn: Connection;

  public constructor(options: KuzuClient.Options) {
    this.dbPath = fsFile(options.databasePath);

    const dbExists = this.dbPath.existsSync();

    if (!dbExists && !options.createIfNotExists) {
      throw new Error(`Database path ${this.dbPath.path} does not exist`);
    }

    const dbPathString: string = this.dbPath.path;
    this.db = new kuzu.Database(
      dbPathString,
      options.bufferManagerSize,
      options.enableCompression,
      options.readonly,
      options.maxDBSize,
      options.autoCheckpoint,
      options.checkpointThreshold,
    );
    this.conn = new kuzu.Connection(this.db);
  }

  public static new(options: KuzuClient.Options) {
    return new KuzuClient(options);
  }

  /**
   * Returns the raw kuzu connection
   */
  public get connection() {
    return this.conn;
  }

  /**
   * Returns the raw kuzu query result
   * Call `getAll` on the result to get the data
   * @tip Use QueryClient.Data.* to type the result
   * @warning Library does not protect against query injection attacks yet
   */
  public async query<T = unknown>(
    template: TemplateStringsArray,
    ...args: string[]
  ) {
    const query = t(template, ...args);
    return await this.conn.query<T>(query);
  }

  /**
   * Returns the query results rows directly
   * @tip Use QueryClient.Data.* to type the result
   * @warning Library does not protect against query injection attacks yet
   */
  public async queryAll<T = unknown>(
    template: TemplateStringsArray,
    ...args: string[]
  ) {
    const result = await this.query<T>(template, ...args);
    return result.getAll();
  }

  /**
   * Returns the first row of the query result
   * @tip Use QueryClient.Data.* to type the result
   * @warning Library does not protect against query injection attacks yet
   */
  public async queryOne<T = unknown>(
    template: TemplateStringsArray,
    ...args: string[]
  ) {
    const result = await this.query<T>(template, ...args);
    return result.getNext();
  }

  /**
   * Returns the loaded extensions
   */
  public async getLoadedExtensions() {
    const res = await this.queryAll<{
      "extension name": string;
      "extension source": string;
      "extension path": string;
    }>`CALL SHOW_LOADED_EXTENSIONS() RETURN *`;
    return res.map((row) => ({
      name: row["extension name"],
      source: row["extension source"],
      path: row["extension path"],
    }));
  }

  public async loadExtension(name: string) {
    const loadedExtensions = await this.getLoadedExtensions();
    if (!loadedExtensions.some((ext) => ext.name === name)) {
      await this.query`INSTALL ${name};`;
    }
  }
}

export declare namespace KuzuClient {
  export interface Options {
    databasePath: FsFile | string;
    createIfNotExists?: boolean;
    enableCompression?: boolean;
    readonly?: boolean;
    bufferManagerSize?: number;
    maxDBSize?: number;
    autoCheckpoint?: boolean;
    checkpointThreshold?: number;
  }

  export namespace Data {
    export type Id = {
      offset: number;
      table: number;
    };

    export type Node<
      LABEL extends string = string,
      DATA extends Record<string, unknown> = Record<string, unknown>,
    > = DATA & {
      _label: LABEL;
      _id: Id;
    };

    export type Relationship<
      LABEL extends string = string,
      DATA extends Record<string, unknown> = Record<string, unknown>,
    > = DATA & {
      _label: LABEL;
      _id: Id;
      _src: Id;
      _dst: Id;
    };

    export interface Path<
      NODE extends Node,
      RELATIONSHIP extends Relationship,
    > {
      _nodes: NODE[];
      _rels: RELATIONSHIP[];
    }
  }
}
