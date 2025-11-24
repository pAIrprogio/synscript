import { FsFile, fsFile } from "@synstack/fs";
import { t } from "@synstack/text";
import * as kuzu from "kuzu";

/**
 * KuzuClient provides a TypeScript-friendly interface to the Kuzu graph database.
 * It wraps the native Kuzu connection with convenient query methods and type safety.
 *
 * All query methods use prepared statements with parameter binding by default for security.
 * Template literal values are automatically bound as parameters to prevent injection attacks.
 *
 * @example
 * ```typescript
 * const client = new KuzuClient({
 *   path: "./my-graph.db",
 *   createIfNotExists: true
 * });
 *
 * // Create schema (static query)
 * await client.queryRaw`CREATE NODE TABLE Person(name STRING, age INT32, PRIMARY KEY (name))`;
 *
 * // Insert data with parameter binding (safe)
 * const name = "Alice";
 * const age = 30;
 * await client.query`CREATE (p:Person {name: ${name}, age: ${age}})`;
 *
 * // Query data with parameter binding (safe)
 * const minAge = 25;
 * const people = await client.queryAll<{name: string, age: number}>`
 *   MATCH (p:Person)
 *   WHERE p.age > ${minAge}
 *   RETURN p.name as name, p.age as age
 * `;
 * ```
 */
export class KuzuClient {
  public readonly dbFile: FsFile;
  private readonly db: kuzu.Database;
  private readonly conn: kuzu.Connection;
  private initPromise: Promise<void> | null = null;

  /**
   * Creates a new KuzuClient instance.
   *
   * @param options - Configuration options for the database connection
   * @throws Error if the database doesn't exist and createIfNotExists is false
   */
  public constructor(options: KuzuClient.Options) {
    this.dbFile = fsFile(options.path);

    const dbExists = this.dbFile.existsSync();

    if (!dbExists && !options.createIfNotExists) {
      throw new Error(`Database path ${this.dbFile.path} does not exist`);
    }

    const dbPathString: string = this.dbFile.path;
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
   * Manually initializes the database connection.
   *
   * The database is automatically initialized on the first query, so you typically
   * don't need to call this method. Use it when you want to ensure the database
   * is ready before executing queries or to catch initialization errors early.
   *
   * @returns A promise that resolves when the database is initialized
   *
   * @example
   * ```typescript
   * const client = KuzuClient.new({ path: "./my-graph.db" });
   *
   * // Manually initialize to catch errors early
   * await client.init();
   *
   * // Now queries will execute immediately
   * await client.query`MATCH (p:Person) RETURN p`;
   * ```
   */
  public async init() {
    if (!this.initPromise) this.initPromise = this.conn.init();
    return this.initPromise;
  }

  /**
   * Closes the database connection and releases resources.
   *
   * After closing, the client can be reinitialized by calling {@link init} or
   * executing a query (which will automatically reinitialize).
   *
   * @returns A promise that resolves when the database is closed
   *
   * @example
   * ```typescript
   * const client = KuzuClient.new({ path: "./my-graph.db" });
   *
   * // Use the database
   * await client.query`CREATE (p:Person {name: "Alice"})`;
   *
   * // Close when done
   * await client.close();
   *
   * // Can reinitialize later
   * await client.init();
   * await client.query`MATCH (p:Person) RETURN p`;
   * ```
   */
  public async close() {
    const promise = this.conn.close();
    this.initPromise = null;
    return promise;
  }

  /**
   * Executes a Cypher query using prepared statements with parameter binding.
   * This is the recommended method for executing queries as it protects against injection attacks.
   *
   * Template literal values are automatically bound as named parameters ($arg0, $arg1, etc.),
   * ensuring safe execution even with user-provided input.
   *
   * @template T - The expected type of query results
   * @param template - Template literal containing the Cypher query
   * @param args - Template literal arguments (automatically bound as parameters)
   * @returns A QueryResult object with methods like hasNext(), getNext(), and getAll()
   *
   * @example
   * ```typescript
   * // Safe parameterized query
   * const minAge = 25;
   * const result = await client.query<{name: string}>`
   *   MATCH (p:Person) WHERE p.age > ${minAge} RETURN p.name as name
   * `;
   * while (result.hasNext()) {
   *   console.log(result.getNext());
   * }
   * ```
   *
   * @see {@link queryAll} for getting all results as an array
   * @see {@link queryOne} for getting only the first result
   * @see {@link queryIterator} for async iteration
   * @see {@link queryRaw} for raw query execution without parameter binding
   */
  public async query<T = unknown>(
    template: TemplateStringsArray,
    ...args: any[]
  ) {
    // If the first query fails, it crashes the database, so we need initialize it manually before executing the query so that it throws instead
    await this.init();
    const idsArray = args.map((_, index) => `$arg${index}`);
    const query = t(template, ...idsArray);
    const preparedStatement = await this.conn.prepare(query);
    const argsMap = Object.fromEntries(
      args.map((arg, index) => [`arg${index}`, arg]),
    );
    return await this.conn.execute<T>(preparedStatement, argsMap);
  }

  /**
   * Executes a Cypher query with parameter binding and returns all result rows as an array.
   * This is the most common way to execute queries that return multiple rows.
   *
   * Uses prepared statements to safely bind template literal values as parameters.
   *
   * @template T - The expected type of each result row
   * @param template - Template literal containing the Cypher query
   * @param args - Template literal arguments (automatically bound as parameters)
   * @returns An array of all result rows
   *
   * @example
   * ```typescript
   * const minAge = 25;
   * const people = await client.queryAll<{name: string, age: number}>`
   *   MATCH (p:Person)
   *   WHERE p.age > ${minAge}
   *   RETURN p.name as name, p.age as age
   *   ORDER BY p.age DESC
   * `;
   * people.forEach(person => console.log(`${person.name}: ${person.age}`));
   * ```
   */
  public async queryAll<T = unknown>(
    template: TemplateStringsArray,
    ...args: any[]
  ) {
    const result = await this.query<T>(template, ...args);
    return result.getAll();
  }

  /**
   * Executes a Cypher query with parameter binding and returns only the first result row.
   * Useful for queries that are expected to return a single row.
   *
   * Uses prepared statements to safely bind template literal values as parameters.
   *
   * @template T - The expected type of the result row
   * @param template - Template literal containing the Cypher query
   * @param args - Template literal arguments (automatically bound as parameters)
   * @returns The first result row
   *
   * @example
   * ```typescript
   * const userName = "Alice";
   * const person = await client.queryOne<{name: string, age: number}>`
   *   MATCH (p:Person {name: ${userName}})
   *   RETURN p.name as name, p.age as age
   * `;
   * console.log(`Found ${person.name}, age ${person.age}`);
   * ```
   *
   * @warning Throws an error if called on an empty result set. Check hasNext() first if unsure.
   */
  public async queryOne<T = unknown>(
    template: TemplateStringsArray,
    ...args: any[]
  ) {
    const result = await this.query<T>(template, ...args);
    return result.getNext();
  }

  /**
   * Executes a Cypher query with parameter binding and returns an async iterator over results.
   * Useful for processing large result sets in a memory-efficient way.
   *
   * Uses prepared statements to safely bind template literal values as parameters.
   *
   * @template T - The expected type of each result row
   * @param template - Template literal containing the Cypher query
   * @param args - Template literal arguments (automatically bound as parameters)
   * @returns An async iterator that yields result rows one at a time
   *
   * @example
   * ```typescript
   * const minAge = 25;
   * for await (const person of client.queryIterator<{name: string, age: number}>`
   *   MATCH (p:Person)
   *   WHERE p.age > ${minAge}
   *   RETURN p.name as name, p.age as age
   * `) {
   *   console.log(`${person.name}: ${person.age}`);
   *   // Process one row at a time without loading all results into memory
   * }
   * ```
   */
  public async *queryIterator<T = unknown>(
    template: TemplateStringsArray,
    ...args: any[]
  ) {
    const result = await this.query<T>(template, ...args);
    while (result.hasNext()) {
      yield await result.getNext();
    }
  }

  /**
   * Executes a Cypher query with direct string interpolation (no parameter binding).
   *
   * @warning This method does NOT use prepared statements or parameter binding.
   * Template literal values are directly interpolated into the query string.
   * Only use this for static queries or when you have full control over the inputs.
   * For user-provided input, use {@link query} instead to prevent injection attacks.
   *
   * @template T - The expected type of query results
   * @param template - Template literal containing the Cypher query
   * @param args - Template literal arguments (directly interpolated into query string)
   * @returns A QueryResult object with methods like hasNext(), getNext(), and getAll()
   *
   * @example
   * ```typescript
   * // Safe: static query with no user input
   * const result = await client.queryRaw<{name: string}>`
   *   MATCH (p:Person) WHERE p.age > 25 RETURN p.name as name
   * `;
   * while (result.hasNext()) {
   *   console.log(result.getNext());
   * }
   * ```
   *
   * @see {@link query} for safe parameterized queries (recommended)
   */
  public async queryRaw<T = unknown>(
    template: TemplateStringsArray,
    ...args: string[]
  ) {
    // If the first query fails, it crashes the database, so we need initialize it manually before executing the query so that it throws instead
    await this.init();
    const query = t(template, ...args);
    return this.conn.query<T>(query);
  }

  /**
   * Executes a Cypher query with direct string interpolation and returns all result rows as an array.
   *
   * @warning This method does NOT use prepared statements or parameter binding.
   * Template literal values are directly interpolated into the query string.
   * Only use this for static queries. For user-provided input, use {@link queryAll} instead.
   *
   * @template T - The expected type of each result row
   * @param template - Template literal containing the Cypher query
   * @param args - Template literal arguments (directly interpolated into query string)
   * @returns An array of all result rows
   *
   * @example
   * ```typescript
   * // Safe: static query with no user input
   * const people = await client.queryRawAll<{name: string, age: number}>`
   *   MATCH (p:Person)
   *   WHERE p.age > 25
   *   RETURN p.name as name, p.age as age
   *   ORDER BY p.age DESC
   * `;
   * people.forEach(person => console.log(`${person.name}: ${person.age}`));
   * ```
   *
   * @see {@link queryAll} for safe parameterized queries (recommended)
   */
  public async queryRawAll<T = unknown>(
    template: TemplateStringsArray,
    ...args: string[]
  ) {
    const result = await this.queryRaw<T>(template, ...args);
    return result.getAll();
  }

  /**
   * Executes a Cypher query with direct string interpolation and returns only the first result row.
   * Useful for queries that are expected to return a single row.
   *
   * @warning This method does NOT use prepared statements or parameter binding.
   * Template literal values are directly interpolated into the query string.
   * Only use this for static queries. For user-provided input, use {@link queryOne} instead.
   *
   * @template T - The expected type of the result row
   * @param template - Template literal containing the Cypher query
   * @param args - Template literal arguments (directly interpolated into query string)
   * @returns The first result row
   *
   * @example
   * ```typescript
   * // Safe: static query with no user input
   * const person = await client.queryRawOne<{name: string, age: number}>`
   *   MATCH (p:Person {name: "Alice"})
   *   RETURN p.name as name, p.age as age
   * `;
   * console.log(`Found ${person.name}, age ${person.age}`);
   * ```
   *
   * @warning Throws an error if called on an empty result set. Check hasNext() first if unsure.
   * @see {@link queryOne} for safe parameterized queries (recommended)
   */
  public async queryRawOne<T = unknown>(
    template: TemplateStringsArray,
    ...args: string[]
  ) {
    const result = await this.queryRaw<T>(template, ...args);
    return result.getNext();
  }

  /**
   * Executes a Cypher query with direct string interpolation and returns an async iterator over results.
   * Useful for processing large result sets in a memory-efficient way.
   *
   * @warning This method does NOT use prepared statements or parameter binding.
   * Template literal values are directly interpolated into the query string.
   * Only use this for static queries. For user-provided input, use {@link queryIterator} instead.
   *
   * @template T - The expected type of each result row
   * @param template - Template literal containing the Cypher query
   * @param args - Template literal arguments (directly interpolated into query string)
   * @returns An async iterator that yields result rows one at a time
   *
   * @example
   * ```typescript
   * // Safe: static query with no user input
   * for await (const person of client.queryRawIterator<{name: string, age: number}>`
   *   MATCH (p:Person)
   *   WHERE p.age > 25
   *   RETURN p.name as name, p.age as age
   * `) {
   *   console.log(`${person.name}: ${person.age}`);
   * }
   * ```
   *
   * @see {@link queryIterator} for safe parameterized queries (recommended)
   */
  public async *queryRawIterator<T = unknown>(
    template: TemplateStringsArray,
    ...args: string[]
  ) {
    const result = await this.queryRaw<T>(template, ...args);
    while (result.hasNext()) {
      yield await result.getNext();
    }
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
    const res = await this.queryRawAll<{
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
      await this.queryRaw`INSTALL ${name};`;
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
