declare module "kuzu" {
  export class Database {
    constructor(
      databasePath: string,
      bufferManagerSize?: number,
      enableCompression?: boolean,
      readOnly?: boolean,
      maxDBSize?: number,
      autoCheckpoint?: boolean,
      checkpointThreshold?: number,
    );
  }

  export class Connection {
    constructor(db: Database);
    query<T = unknown>(query: string): Promise<QueryResult<T>>;
  }

  export interface QueryResult<T> {
    getAll(): T[];
    getNext(): T | null;
  }

  const kuzu: {
    Database: typeof Database;
    Connection: typeof Connection;
  };

  export default kuzu;
}
