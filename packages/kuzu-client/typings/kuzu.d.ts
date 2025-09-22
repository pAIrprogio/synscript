declare module "kuzu" {
  /**
   * Represents a Kuzu database.
   */
  export class Database {
    /**
     * Initialize a new Database object. Note that the initialization is done
     * lazily, so the database file is not opened until the first query is
     * executed. To initialize the database immediately, call the `init()`
     * function on the returned object.
     *
     * @param databasePath Path to the database file. If the path is not specified, or empty, or equal to
     * `:memory:`, the database will be created in memory.
     * @param bufferManagerSize Size of the buffer manager in bytes.
     * @param enableCompression Whether to enable compression.
     * @param readOnly If true, database will be opened in read-only mode.
     * @param maxDBSize Maximum size of the database file in bytes.
     * @param autoCheckpoint Whether to automatically checkpoint.
     * @param checkpointThreshold Threshold for automatic checkpointing.
     */
    constructor(
      databasePath?: string,
      bufferManagerSize?: number,
      enableCompression?: boolean,
      readOnly?: boolean,
      maxDBSize?: number,
      autoCheckpoint?: boolean,
      checkpointThreshold?: number,
    );

    /**
     * Get the version of the library.
     * @returns The version of the library.
     */
    static getVersion(): string;

    /**
     * Get the storage version of the library.
     * @returns The storage version of the library.
     */
    static getStorageVersion(): number;

    /**
     * Initialize the database. Calling this function is optional, as the
     * database is initialized automatically when the first query is executed.
     */
    init(): Promise<void>;

    /**
     * Initialize the database synchronously. Calling this function is optional, as the
     * database is initialized automatically when the first query is executed. This function
     * may block the main thread, so use it with caution.
     */
    initSync(): void;

    /**
     * Close the database.
     */
    close(): Promise<void>;

    /**
     * Close the database synchronously.
     * @throws Error if there is an ongoing asynchronous initialization.
     */
    closeSync(): void;
  }

  /**
   * Represents a connection to a Kuzu database.
   */
  export class Connection {
    /**
     * Initialize a new Connection object. Note that the initialization is done
     * lazily, so the connection is not initialized until the first query is
     * executed. To initialize the connection immediately, call the `init()`
     * function on the returned object.
     *
     * @param database The database object to connect to.
     * @param numThreads The maximum number of threads to use for query execution.
     */
    constructor(database: Database, numThreads?: number);

    /**
     * Initialize the connection. Calling this function is optional, as the
     * connection is initialized automatically when the first query is executed.
     */
    init(): Promise<void>;

    /**
     * Initialize the connection synchronously. Calling this function is optional, as the
     * connection is initialized automatically when the first query is executed. This function
     * may block the main thread, so use it with caution.
     */
    initSync(): void;

    /**
     * Execute a prepared statement with the given parameters.
     * @template T The type of rows returned by the query. Defaults to Record<string, any>.
     * @param preparedStatement The prepared statement to execute.
     * @param params A plain object mapping parameter names to values.
     * @param progressCallback Optional callback function that is invoked with the progress of the query execution.
     * @returns A promise that resolves to the query result.
     */
    execute<T = Record<string, any>>(
      preparedStatement: PreparedStatement,
      params?: Record<string, any>,
      progressCallback?: (
        pipelineProgress: number,
        numPipelinesFinished: number,
        numPipelines: number,
      ) => void,
    ): Promise<QueryResult<T>>;

    /**
     * Execute a prepared statement with the given parameters synchronously.
     * @template T The type of rows returned by the query. Defaults to Record<string, any>.
     * @param preparedStatement The prepared statement to execute.
     * @param params A plain object mapping parameter names to values.
     * @returns A query result.
     */
    executeSync<T = Record<string, any>>(
      preparedStatement: PreparedStatement,
      params?: Record<string, any>,
    ): QueryResult<T>;

    /**
     * Prepare a statement for execution.
     * @param statement The statement to prepare.
     * @returns A promise that resolves to a prepared statement.
     */
    prepare(statement: string): Promise<PreparedStatement>;

    /**
     * Prepare a statement for execution synchronously.
     * @param statement The statement to prepare.
     * @returns A prepared statement.
     */
    prepareSync(statement: string): PreparedStatement;

    /**
     * Execute a statement.
     * @template T The type of rows returned by the query. Defaults to Record<string, any>.
     * @param statement The statement to execute.
     * @param progressCallback Optional callback function that is invoked with the progress of the query execution.
     * @returns A promise that resolves to the query result.
     */
    query<T = Record<string, any>>(
      statement: string,
      progressCallback?: (
        pipelineProgress: number,
        numPipelinesFinished: number,
        numPipelines: number,
      ) => void,
    ): Promise<QueryResult<T>>;

    /**
     * Execute a statement synchronously.
     * @template T The type of rows returned by the query. Defaults to Record<string, any>.
     * @param statement The statement to execute.
     * @returns A query result.
     */
    querySync<T = Record<string, any>>(statement: string): QueryResult<T>;

    /**
     * Set the maximum number of threads to use for query execution.
     * @param numThreads The maximum number of threads to use.
     */
    setMaxNumThreadForExec(numThreads: number): void;

    /**
     * Set the query timeout.
     * @param timeoutInMs The timeout in milliseconds.
     */
    setQueryTimeout(timeoutInMs: number): void;

    /**
     * Close the connection.
     */
    close(): Promise<void>;

    /**
     * Close the connection synchronously.
     */
    closeSync(): void;
  }

  /**
   * Represents a prepared statement.
   */
  export class PreparedStatement {
    /**
     * Check if the prepared statement is successfully prepared.
     * @returns True if the prepared statement is successfully prepared.
     */
    isSuccess(): boolean;

    /**
     * Get the error message if the prepared statement is not successfully prepared.
     * @returns The error message.
     */
    getErrorMessage(): string;
  }

  /**
   * Represents a query result.
   * @template T The type of rows returned by the query. Defaults to Record<string, any>.
   */
  export class QueryResult<T = Record<string, any>> {
    /**
     * Reset the iterator of the query result to the beginning.
     */
    resetIterator(): void;

    /**
     * Check if the query result has more rows.
     * @returns True if the query result has more rows.
     */
    hasNext(): boolean;

    /**
     * Get the number of rows of the query result.
     * @returns The number of rows of the query result.
     */
    getNumTuples(): number;

    /**
     * Get the next row of the query result.
     * @returns A promise that resolves to the next row of the query result.
     */
    getNext(): Promise<T>;

    /**
     * Get the next row of the query result synchronously.
     * @returns The next row of the query result.
     */
    getNextSync(): T;

    /**
     * Iterate through the query result with callback functions.
     * @param resultCallback The callback function that is called for each row of the query result.
     * @param doneCallback The callback function that is called when the iteration is done.
     * @param errorCallback The callback function that is called when there is an error.
     */
    each(
      resultCallback: (row: T) => void,
      doneCallback: () => void,
      errorCallback: (error: Error) => void,
    ): void;

    /**
     * Get all rows of the query result.
     * @returns A promise that resolves to all rows of the query result.
     */
    getAll(): Promise<T[]>;

    /**
     * Get all rows of the query result synchronously.
     * @returns All rows of the query result.
     */
    getAllSync(): T[];

    /**
     * Get all rows of the query result with callback functions.
     * @param resultCallback The callback function that is called with all rows of the query result.
     * @param errorCallback The callback function that is called when there is an error.
     */
    all(
      resultCallback: (rows: T[]) => void,
      errorCallback: (error: Error) => void,
    ): void;

    /**
     * Get the data types of the columns of the query result.
     * @returns A promise that resolves to the data types of the columns of the query result.
     */
    getColumnDataTypes(): Promise<string[]>;

    /**
     * Get the data types of the columns of the query result synchronously.
     * @returns The data types of the columns of the query result.
     */
    getColumnDataTypesSync(): string[];

    /**
     * Get the names of the columns of the query result.
     * @returns A promise that resolves to the names of the columns of the query result.
     */
    getColumnNames(): Promise<string[]>;

    /**
     * Get the names of the columns of the query result synchronously.
     * @returns The names of the columns of the query result.
     */
    getColumnNamesSync(): string[];

    /**
     * Close the query result.
     */
    close(): void;
  }

  /**
   * Get the version of the library.
   */
  export function VERSION(): string;

  /**
   * Get the storage version of the library.
   */
  export function STORAGE_VERSION(): number;
}
