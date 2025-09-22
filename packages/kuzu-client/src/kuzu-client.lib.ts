import { FsFile, fsFile } from "@synstack/fs";
import { t } from "@synstack/text";
import kuzu, { type Connection, type Database } from "kuzu";

/**
 * KuzuClient provides a TypeScript-friendly interface to the Kuzu graph database.
 * It wraps the native Kuzu connection with convenient query methods and type safety.
 *
 * @example
 * ```typescript
 * const client = new KuzuClient({
 *   path: "./my-graph.db",
 *   createIfNotExists: true
 * });
 *
 * // Create schema
 * await client.query`CREATE NODE TABLE Person(name STRING, age INT32, PRIMARY KEY (name))`;
 *
 * // Insert data
 * await client.query`CREATE (p:Person {name: "Alice", age: 30})`;
 *
 * // Query data
 * const people = await client.queryAll<{name: string, age: number}>`
 *   MATCH (p:Person) RETURN p.name as name, p.age as age
 * `;
 * ```
 */
export class KuzuClient {
  private readonly dbPath: FsFile | string;
  private readonly db: Database;
  private readonly conn: Connection;

  /**
   * Creates a new KuzuClient instance.
   *
   * @param options - Configuration options for the database connection
   * @throws Error if the database doesn't exist and createIfNotExists is false
   */
  public constructor(options: KuzuClient.Options) {
    this.dbPath = fsFile(options.path);

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

  /**
   * Static factory method to create a new KuzuClient instance.
   * Provides a fluent API alternative to using the constructor.
   *
   * @param options - Configuration options for the database connection
   * @returns A new KuzuClient instance
   *
   * @example
   * ```typescript
   * const client = KuzuClient.new({
   *   path: "./my-graph.db",
   *   createIfNotExists: true
   * });
   * ```
   */
  public static new(options: KuzuClient.Options) {
    return new KuzuClient(options);
  }

  /**
   * Returns the raw Kuzu connection instance.
   * Use this when you need direct access to the underlying Kuzu API.
   *
   * @returns The native Kuzu Connection object
   */
  public get connection() {
    return this.conn;
  }

  /**
   * Executes a Cypher query and returns the raw QueryResult.
   * Use this when you need full control over result iteration.
   *
   * @template T - The expected type of query results
   * @param template - Template literal containing the Cypher query
   * @param args - Template literal arguments (automatically escaped)
   * @returns A QueryResult object with methods like getNext() and getAll()
   *
   * @example
   * ```typescript
   * const result = await client.query<{name: string}>`
   *   MATCH (p:Person) WHERE p.age > 25 RETURN p.name as name
   * `;
   * while (result.hasNext()) {
   *   console.log(result.getNext());
   * }
   * ```
   *
   * @warning String interpolation does not automatically add quotes for string values.
   * Use quotes in the template: `WHERE name = "${name}"`
   */
  public async query<T = unknown>(
    template: TemplateStringsArray,
    ...args: string[]
  ) {
    const query = t(template, ...args);
    return await this.conn.query<T>(query);
  }

  /**
   * Executes a Cypher query and returns all result rows as an array.
   * This is the most common way to execute queries that return multiple rows.
   *
   * @template T - The expected type of each result row
   * @param template - Template literal containing the Cypher query
   * @param args - Template literal arguments (automatically escaped)
   * @returns An array of all result rows
   *
   * @example
   * ```typescript
   * const people = await client.queryAll<{name: string, age: number}>`
   *   MATCH (p:Person)
   *   WHERE p.age > 25
   *   RETURN p.name as name, p.age as age
   *   ORDER BY p.age DESC
   * `;
   * people.forEach(person => console.log(`${person.name}: ${person.age}`));
   * ```
   *
   * @warning String interpolation does not automatically add quotes for string values.
   * Use quotes in the template: `WHERE name = "${name}"`
   */
  public async queryAll<T = unknown>(
    template: TemplateStringsArray,
    ...args: string[]
  ) {
    const result = await this.query<T>(template, ...args);
    return result.getAll();
  }

  /**
   * Executes a Cypher query and returns only the first result row.
   * Useful for queries that are expected to return a single row.
   *
   * @template T - The expected type of the result row
   * @param template - Template literal containing the Cypher query
   * @param args - Template literal arguments (automatically escaped)
   * @returns The first result row, or null if no results
   *
   * @example
   * ```typescript
   * const person = await client.queryOne<{name: string, age: number}>`
   *   MATCH (p:Person {name: "Alice"})
   *   RETURN p.name as name, p.age as age
   * `;
   * if (person) {
   *   console.log(`Found ${person.name}, age ${person.age}`);
   * }
   * ```
   *
   * @warning String interpolation does not automatically add quotes for string values.
   * Use quotes in the template: `WHERE name = "${name}"`
   * @warning Throws an error if called on an empty result set. Check hasNext() first if unsure.
   */
  public async queryOne<T = unknown>(
    template: TemplateStringsArray,
    ...args: string[]
  ) {
    const result = await this.query<T>(template, ...args);
    return result.getNext();
  }

  /**
   * Retrieves information about all currently loaded Kuzu extensions.
   *
   * @returns An array of extension information objects
   *
   * @example
   * ```typescript
   * const extensions = await client.getLoadedExtensions();
   * extensions.forEach(ext => {
   *   console.log(`${ext.name} from ${ext.source}`);
   * });
   * ```
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

  /**
   * Loads a Kuzu extension by name if it's not already loaded.
   * Extensions provide additional functionality like JSON support, HTTP operations, etc.
   *
   * @param name - The name of the extension to load (e.g., "json", "httpfs")
   *
   * @example
   * ```typescript
   * await client.loadExtension("json");
   * // Now you can use JSON functions in queries
   * await client.query`CREATE (p:Person {data: to_json('{"key": "value"}')})`;
   * ```
   */
  public async loadExtension(name: string) {
    const loadedExtensions = await this.getLoadedExtensions();
    if (!loadedExtensions.some((ext) => ext.name === name)) {
      await this.query`INSTALL ${name};`;
    }
  }
}

export declare namespace KuzuClient {
  export interface Options {
    /**
     * The path to the database file
     */
    path: FsFile | string;
    /**
     * Whether to create the database file if it does not exist
     */
    createIfNotExists?: boolean;
    /**
     * Whether to enable compression
     */
    enableCompression?: boolean;
    /**
     * Whether to open the database in read-only mode
     */
    readonly?: boolean;
    /**
     * The size of the buffer manager in bytes
     */
    bufferManagerSize?: number;
    /**
     * The maximum size of the database file in bytes
     */
    maxDBSize?: number;
    /**
     * Whether to automatically checkpoint
     */
    autoCheckpoint?: boolean;
    /**
     * The threshold for automatic checkpointing
     */
    checkpointThreshold?: number;
  }

  /**
   * Type definitions for Kuzu graph data structures.
   * Use these types to properly type your query results.
   */
  export namespace Data {
    /**
     * Represents a unique identifier for nodes and relationships in Kuzu.
     */
    export type Id = {
      offset: number;
      table: number;
    };

    /**
     * Represents a node in the graph with its label and properties.
     *
     * @template LABEL - The node label (e.g., "Person", "City")
     * @template DATA - The shape of the node's properties
     *
     * @example
     * ```typescript
     * type PersonNode = KuzuClient.Data.Node<"Person", {
     *   name: string;
     *   age: number;
     * }>;
     * ```
     */
    export type Node<
      LABEL extends string = string,
      DATA extends Record<string, unknown> = Record<string, unknown>,
    > = DATA & {
      _label: LABEL;
      _id: Id;
    };

    /**
     * Represents a relationship (edge) in the graph with its label and properties.
     *
     * @template LABEL - The relationship label (e.g., "KNOWS", "LIVES_IN")
     * @template DATA - The shape of the relationship's properties
     *
     * @example
     * ```typescript
     * type KnowsRel = KuzuClient.Data.Relationship<"KNOWS", {
     *   since: string;
     *   strength: number;
     * }>;
     * ```
     */
    export type Relationship<
      LABEL extends string = string,
      DATA extends Record<string, unknown> = Record<string, unknown>,
    > = DATA & {
      _label: LABEL;
      _id: Id;
      _src: Id;
      _dst: Id;
    };

    /**
     * Represents a path through the graph, consisting of nodes and relationships.
     *
     * @template NODE - The type of nodes in the path
     * @template RELATIONSHIP - The type of relationships in the path
     *
     * @example
     * ```typescript
     * type SocialPath = KuzuClient.Data.Path<
     *   PersonNode,
     *   KnowsRel
     * >;
     * ```
     */
    export interface Path<
      NODE extends Node,
      RELATIONSHIP extends Relationship,
    > {
      _nodes: NODE[];
      _rels: RELATIONSHIP[];
    }
  }
}
