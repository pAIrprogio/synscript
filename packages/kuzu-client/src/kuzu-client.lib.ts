import { FsFile, fsFile } from "@synstack/fs";
import type { Connection, Database } from "kuzu";
import kuzu from "kuzu";


export class KuzuClient {
  private dbPath: FsFile | string;
  private db: Database;
  private conn: Connection;

  constructor(options: KuzuClientOptions) {
    this.dbPath = fsFile(options.databasePath);

    const dbExists = this.dbPath.existsSync();

    if (!dbExists && !options.createIfNotExists) {
      throw new Error(
        `Database path ${this.dbPath.path} does not exist, check your configuration`
      );
    }

    const dbPathString: string = this.dbPath.path;
    this.db = new kuzu.Database(dbPathString);
    this.conn = new kuzu.Connection(this.db);
  }

  /**
   * Returns the raw kuzu query result
   * Call `getAll` on the result to get the data
   */
  async query<T = unknown>(template: TemplateStringsArray) {
    const query = template.join("");
    return await this.conn.query<T>(query);
  }

  /**
   * Returns the query results rows directly
   */
  async queryAll<T = unknown>(template: TemplateStringsArray): Promise<T[]> {
    const queryResult = await this.query<T>(template);
    return queryResult.getAll();
  }

  /**
   * Returns the first row of the query result
   */
  async queryOne<T = unknown>(template: TemplateStringsArray): Promise<T | null> { 
    const result = await this.query<T>(template);
    return result.getNext() || null;
  }
}

/**
 * Options for KuzuClient constructor
 */
export interface KuzuClientOptions {
  databasePath: FsFile | string;
  createIfNotExists?: boolean;
}

