import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Database, Connection } from "kuzu";
import kuzu from "kuzu";

export class KuzuClient {
  private dbPath: string;
  private db: Database;
  private conn: Connection;

  constructor(options: KuzuClient.Options) {
    this.dbPath = resolve(options.databasePath);
    const dbExists = existsSync(this.dbPath);

    if (!dbExists && !options.createIfNotExists) {
      throw new Error(
        `Database path ${this.dbPath} does not exist, check your configuration`
      );
    }

    this.db = new kuzu.Database(this.dbPath);
    this.conn = new kuzu.Connection(this.db);
  }

  /**
   * Returns the raw kuzu query result
   * Call `getAll` on the result to get the data
   */
  async query<T = unknown>(query: string) {
    return await this.conn.query<T>(query);
  }

  /**
   * Returns the query results rows directly
   */
  async queryAll<T = unknown>(query: string): Promise<T[]> {
    const queryResult = await this.query<T>(query);
    return queryResult.getAll();
  }

  /**
   * Returns the first row of the query result
   */
  async queryOne<T = unknown>(query: string): Promise<T | null> {
    const result = await this.query<T>(query);
    return result.getNext() || null;
  }
}

/**
 * Namespace for types and utilities
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace KuzuClient {
  /**
   * Options for creating a kuzu client
   */
  export interface Options {

    databasePath: string;
    createIfNotExists?: boolean;
  }

  /**
   * Factory to create a client instance
   */
  export function create(options: Options): KuzuClient {
    return new KuzuClient(options);
  }

  /**
   * Factory to create an object-style client
   */
  export function createObject(options: Options) {
    const dbPath = resolve(options.databasePath);
    const dbExists = existsSync(dbPath);

    if (!dbExists && !options.createIfNotExists) {
      throw new Error(
        `Database path ${dbPath} does not exist, check your configuration`
      );
    }

    const db = new kuzu.Database(dbPath);
    const conn = new kuzu.Connection(db);

    return {
      /**
       * Returns the raw kuzu query result
       * Call `getAll` on the result to get the data
       */
      async query<T = unknown>(query: string) {
        return await conn.query<T>(query);
      },

      /**
       * Returns the query results rows directly
       */
      async queryAll<T = unknown>(query: string) {
        const queryResult = await this.query<T>(query);
        return queryResult.getAll();
      },

      /**
       * Returns the first row of the query result
       */
      async queryOne<T = unknown>(query: string) {
        const result = await this.query<T>(query);
        return result.getNext();
      },
    };
  }

}