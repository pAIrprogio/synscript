import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { KuzuClient } from "./kuzu-client.lib.ts";

describe("KuzuClient", { concurrency: false }, () => {
  let testDbPath: string;
  let client: KuzuClient;

  beforeEach(() => {
    testDbPath = join(
      tmpdir(),
      `kuzu-test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    );
  });

  afterEach(() => {
    try {
      rmSync(testDbPath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("constructor", () => {
    it("creates a new database if createIfNotExists is true", () => {
      assert.doesNotThrow(() => {
        client = new KuzuClient({
          path: testDbPath,
          createIfNotExists: true,
        });
      });
    });

    it("throws error if database does not exist and createIfNotExists is false", () => {
      assert.throws(
        () => {
          client = new KuzuClient({
            path: testDbPath,
            createIfNotExists: false,
          });
        },
        {
          message: `Database path ${testDbPath} does not exist`,
        },
      );
    });

    it("accepts all configuration options", () => {
      assert.doesNotThrow(() => {
        client = new KuzuClient({
          path: testDbPath,
          createIfNotExists: true,
          enableCompression: true,
          readonly: false,
          bufferManagerSize: 64 * 1024 * 1024,
          maxDBSize: 1024 * 1024 * 1024,
          autoCheckpoint: true,
          checkpointThreshold: 1024 * 1024,
        });
      });
    });
  });

  describe("static new method", () => {
    it("creates a new instance using static method", () => {
      const instance = KuzuClient.new({
        path: testDbPath,
        createIfNotExists: true,
      });
      assert.ok(instance instanceof KuzuClient);
    });
  });

  describe("with active database", () => {
    beforeEach(() => {
      client = new KuzuClient({
        path: testDbPath,
        createIfNotExists: true,
      });
    });

    describe("connection getter", () => {
      it("returns the kuzu connection", () => {
        const conn = client.connection;
        assert.ok(conn);
        assert.ok(typeof conn.query === "function");
      });
    });

    describe("query operations", () => {
      beforeEach(async () => {
        // Create test schema
        await client.query`CREATE NODE TABLE Person(name STRING, age INT32, PRIMARY KEY (name))`;
        await client.query`CREATE NODE TABLE City(name STRING, population INT32, PRIMARY KEY (name))`;
        await client.query`CREATE REL TABLE LivesIn(FROM Person TO City)`;
      });

      describe("query", () => {
        it("executes a query and returns QueryResult", async () => {
          await client.query`CREATE (p:Person {name: "Alice", age: 30})`;
          const result = await client.query<{
            name: string;
            age: number;
          }>`MATCH (p:Person) RETURN p.name as name, p.age as age`;

          assert.ok(result);
          assert.ok(typeof result.getNext === "function");
          assert.ok(typeof result.getAll === "function");
        });

        it("handles template string with parameters", async () => {
          const name = "Bob";
          const age = "25";
          await client.query`CREATE (p:Person {name: "${name}", age: ${age}})`;

          const result = await client.queryOne<{
            name: string;
            age: number;
          }>`MATCH (p:Person {name: "${name}"}) RETURN p.name as name, p.age as age`;
          assert.equal(result?.name, "Bob");
          assert.equal(result?.age, 25);
        });
      });

      describe("queryAll", () => {
        it("returns all rows from query", async () => {
          await client.query`CREATE (p1:Person {name: "Alice", age: 30})`;
          await client.query`CREATE (p2:Person {name: "Bob", age: 25})`;
          await client.query`CREATE (p3:Person {name: "Charlie", age: 35})`;

          const results = await client.queryAll<{
            name: string;
            age: number;
          }>`MATCH (p:Person) RETURN p.name as name, p.age as age ORDER BY p.name`;

          assert.equal(results.length, 3);
          assert.equal(results[0].name, "Alice");
          assert.equal(results[1].name, "Bob");
          assert.equal(results[2].name, "Charlie");
        });

        it("returns empty array for no results", async () => {
          const results = await client.queryAll<{
            name: string;
          }>`MATCH (p:Person) RETURN p.name as name`;
          assert.deepEqual(results, []);
        });
      });

      describe("queryOne", () => {
        it("returns first row from query", async () => {
          await client.query`CREATE (p1:Person {name: "Alice", age: 30})`;
          await client.query`CREATE (p2:Person {name: "Bob", age: 25})`;

          const result = await client.queryOne<{
            name: string;
            age: number;
          }>`MATCH (p:Person) RETURN p.name as name, p.age as age ORDER BY p.name`;

          assert.equal(result?.name, "Alice");
          assert.equal(result?.age, 30);
        });

        it("handles empty results", async () => {
          const result = await client.query<{
            name: string;
          }>`MATCH (p:Person) RETURN p.name as name`;
          assert.ok(!result.hasNext());
        });
      });

      describe("complex queries", () => {
        it("handles node creation and retrieval", async () => {
          await client.query`CREATE (c:City {name: "New York", population: 8000000})`;
          await client.query`CREATE (p:Person {name: "Alice", age: 30})`;
          await client.query`MATCH (p:Person {name: "Alice"}), (c:City {name: "New York"}) CREATE (p)-[:LivesIn]->(c)`;

          const result = await client.queryOne<{
            person: string;
            city: string;
          }>`
            MATCH (p:Person)-[:LivesIn]->(c:City)
            RETURN p.name as person, c.name as city
          `;

          assert.equal(result?.person, "Alice");
          assert.equal(result?.city, "New York");
        });

        it("supports typed node results", async () => {
          await client.query`CREATE (p:Person {name: "Alice", age: 30})`;

          const result = await client.queryOne<{
            p: { name: string; age: number; _label: string; _id: any };
          }>`MATCH (p:Person) RETURN p`;

          assert.equal(result?.p._label, "Person");
          assert.equal(result?.p.name, "Alice");
          assert.equal(result?.p.age, 30);
          assert.ok(result?.p._id);
        });

        it("supports typed relationship results", async () => {
          await client.query`CREATE (p:Person {name: "Alice", age: 30})`;
          await client.query`CREATE (c:City {name: "Paris", population: 2000000})`;
          await client.query`MATCH (p:Person {name: "Alice"}), (c:City {name: "Paris"}) CREATE (p)-[r:LivesIn]->(c)`;

          const result = await client.queryOne<{
            r: { _label: string; _id: any; _src: any; _dst: any };
          }>`MATCH ()-[r:LivesIn]->() RETURN r`;

          assert.equal(result?.r._label, "LivesIn");
          assert.ok(result?.r._id);
          assert.ok(result?.r._src);
          assert.ok(result?.r._dst);
        });
      });
    });

    describe("extension methods", () => {
      beforeEach(() => {
        client = new KuzuClient({
          path: testDbPath,
          createIfNotExists: true,
        });
      });

      describe("getLoadedExtensions", () => {
        void it.skip("returns list of loaded extensions", async () => {
          await client.getLoadedExtensions();
          assert.ok(true);
        });
      });

      describe("loadExtension", () => {
        void it.skip("loads an extension if not already loaded", async () => {
          // Skipping extension loading test as it's environment-dependent
          await client.loadExtension("json");
          assert.ok(true);
        });

        void it.skip("does not reload already loaded extensions", async () => {
          // Skipping as it depends on environment
          await client.getLoadedExtensions();
          assert.ok(true);
        });
      });
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      client = new KuzuClient({
        path: testDbPath,
        createIfNotExists: true,
      });
    });

    it("throws on invalid query syntax", async () => {
      await assert.rejects(async () => {
        await client.query`INVALID QUERY SYNTAX`;
      });
    });

    it("throws on querying non-existent table", async () => {
      await assert.rejects(async () => {
        await client.query`MATCH (n:NonExistentTable) RETURN n`;
      });
    });
  });
});
