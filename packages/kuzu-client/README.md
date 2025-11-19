# @synstack/kuzu-client

> TypeScript-friendly interface to the Kuzu graph database

This package provides a strongly-typed, chainable API for working with Kuzu, an embedded graph database. It wraps the native Kuzu connection with convenient query methods and type safety.

## Breaking Changes in v2.0.0

**Query method behavior has changed:**

- **`query()`, `queryAll()`, `queryOne()`**
  - Use prepared statements with parameter binding by default.
  - Safe to use with user-provided input.
  - Prepared statements can only declare one statement per query.
  - Strings do not have to be wrapped in quotes anymore.
- **Legacy `query()` has been renamed to `queryRaw()`**
  - Added for retro-compatibility with direct string interpolation (use only for static queries like schema definitions).
  - Unsafe to use with user-provided input.
  - Prepared statements can declare multiple statements per query.
  - Strings must be wrapped in quotes inside the template.

## What is it for?

Turn complex graph database operations into type-safe, parameterized queries:

```typescript
import { KuzuClient } from "@synstack/kuzu-client";

// Create a database client
const client = KuzuClient.new({
  path: "./my-graph.db",
  createIfNotExists: true
});

// Create schema (static queries use queryRaw)
await client.queryRaw`CREATE NODE TABLE Person(name STRING, age INT32, PRIMARY KEY (name))`;
await client.queryRaw`CREATE REL TABLE KNOWS(FROM Person TO Person, since STRING)`;

// Insert data with parameter binding (safe)
const alice = { name: "Alice", age: 30 };
const bob = { name: "Bob", age: 25 };
await client.query`CREATE (p:Person {name: ${alice.name}, age: ${alice.age}})`;
await client.query`CREATE (p:Person {name: ${bob.name}, age: ${bob.age}})`;

// Create relationships with parameters
await client.query`
  MATCH (a:Person), (b:Person)
  WHERE a.name = ${alice.name} AND b.name = ${bob.name}
  CREATE (a)-[k:KNOWS {since: ${"2020"}}]->(b)
`;

// Query with type safety and parameter binding
const minAge = 25;
const people = await client.queryAll<{name: string, age: number}>`
  MATCH (p:Person)
  WHERE p.age > ${minAge}
  RETURN p.name as name, p.age as age
  ORDER BY p.age DESC
`;

people.forEach(person => console.log(`${person.name}: ${person.age}`));
// Alice: 30
```

## Installation

```bash
# Using npm
npm install @synstack/kuzu-client kuzu

# Using yarn
yarn add @synstack/kuzu-client kuzu

# Using pnpm
pnpm add @synstack/kuzu-client kuzu
```

> [!NOTE]
> This package requires the `kuzu` peer dependency. After installation, you may need to run the Kuzu install script:
> ```bash
> pnpm kuzu:install
> ```

## Features

### Client Creation

Create a KuzuClient instance using the constructor or static factory method:

```typescript
import { KuzuClient } from "@synstack/kuzu-client";

// Using constructor
const client = new KuzuClient({
  path: "./my-graph.db",
  createIfNotExists: true
});

// Using factory method
const client = KuzuClient.new({
  path: "./my-graph.db",
  createIfNotExists: true
});
```

#### Configuration Options

```typescript
const client = KuzuClient.new({
  // Required: path to database file
  path: "./my-graph.db",

  // Create database if it doesn't exist
  createIfNotExists: true,

  // Optional: buffer manager size in bytes
  bufferManagerSize: 1024 * 1024 * 100, // 100MB

  // Optional: enable compression
  enableCompression: true,

  // Optional: open in read-only mode
  readonly: false,

  // Optional: maximum database size in bytes
  maxDBSize: 1024 * 1024 * 1024, // 1GB

  // Optional: auto-checkpoint settings
  autoCheckpoint: true,
  checkpointThreshold: 1000000
});
```

### Query Execution

KuzuClient provides two sets of query methods:

- **Safe methods** (`query`, `queryAll`, `queryOne`, `queryIterator`) - Use prepared statements with parameter binding (recommended)
- **Raw methods** (`queryRaw`, `queryRawAll`, `queryRawOne`, `queryRawIterator`) - Direct string interpolation (use only for static queries)

#### Safe Parameterized Queries (Recommended)

These methods use prepared statements to safely bind template literal values as parameters, protecting against injection attacks:

```typescript
const minAge = 25;
const userName = "Alice";

// Execute query and get raw result
const result = await client.query<{name: string}>`
  MATCH (p:Person) WHERE p.age > ${minAge} RETURN p.name as name
`;
while (result.hasNext()) {
  console.log(result.getNext());
}

// Get all results as array
const people = await client.queryAll<{name: string, age: number}>`
  MATCH (p:Person)
  WHERE p.age > ${minAge}
  RETURN p.name as name, p.age as age
`;

// Get first result only
const person = await client.queryOne<{name: string, age: number}>`
  MATCH (p:Person {name: ${userName}})
  RETURN p.name as name, p.age as age
`;

// Iterate over results (memory-efficient for large datasets)
for await (const person of client.queryIterator<{name: string, age: number}>`
  MATCH (p:Person)
  WHERE p.age > ${minAge}
  RETURN p.name as name, p.age as age
`) {
  console.log(`${person.name}: ${person.age}`);
}
```

**Parameter binding is automatic** - template literal values are safely bound as named parameters (`$arg0`, `$arg1`, etc.) without any manual escaping needed.

#### Raw Queries (For Static Queries Only)

Use raw query methods only for static queries where all values are known at compile time:

```typescript
// Safe: static query with no dynamic values
const result = await client.queryRaw<{name: string}>`
  MATCH (p:Person) WHERE p.age > 25 RETURN p.name as name
`;

// Available raw methods:
await client.queryRaw`...`;        // Returns QueryResult
await client.queryRawAll`...`;     // Returns array
await client.queryRawOne`...`;     // Returns first row
for await (const row of client.queryRawIterator`...`) { } // Async iterator
```

> [!WARNING]
> Raw query methods do NOT use parameter binding. Template literal values are directly interpolated into the query string. Never use raw methods with user-provided input as this creates injection vulnerabilities.

### Database Lifecycle

Control database initialization and resource cleanup:

```typescript
const client = KuzuClient.new({ path: "./my-graph.db" });

// Manual initialization (optional - auto-initialized on first query)
await client.init();

// Use the database
await client.query`CREATE (p:Person {name: "Alice"})`;

// Close when done
await client.close();

// Can reinitialize later
await client.init();
await client.query`MATCH (p:Person) RETURN p`;
```

The database is automatically initialized on the first query, so calling `init()` is optional. Use it when you want to catch initialization errors early or ensure the database is ready before executing queries.

### Type Safety

Use TypeScript types to define the shape of your query results:

```typescript
import { KuzuClient } from "@synstack/kuzu-client";

// Define node types
type PersonNode = KuzuClient.Data.Node<"Person", {
  name: string;
  age: number;
}>;

// Define relationship types
type KnowsRel = KuzuClient.Data.Relationship<"KNOWS", {
  since: string;
  strength?: number;
}>;

// Query with typed results
const result = await client.queryAll<{
  person: PersonNode;
  friend: PersonNode;
  rel: KnowsRel;
}>`
  MATCH (p:Person)-[k:KNOWS]->(f:Person)
  RETURN p as person, k as rel, f as friend
`;

result.forEach(({ person, friend, rel }) => {
  console.log(`${person.name} knows ${friend.name} since ${rel.since}`);
});
```

#### Built-in Graph Types

The package provides type definitions for Kuzu's graph data structures:

```typescript
// Node with label and properties
type PersonNode = KuzuClient.Data.Node<"Person", {
  name: string;
  age: number;
}>;

// Relationship with label and properties
type KnowsRel = KuzuClient.Data.Relationship<"KNOWS", {
  since: string;
}>;

// Path through the graph
type SocialPath = KuzuClient.Data.Path<PersonNode, KnowsRel>;

// Internal node/relationship ID
type Id = KuzuClient.Data.Id; // { offset: number; table: number }
```

### Extensions

Load Kuzu extensions to enable additional functionality:

```typescript
// Load JSON extension
await client.loadExtension("json");

// Now you can use JSON functions
await client.query`
  CREATE (p:Person {data: to_json('{"key": "value"}')})
`;

// Get loaded extensions
const extensions = await client.getLoadedExtensions();
extensions.forEach(ext => {
  console.log(`${ext.name} from ${ext.source}`);
});
```

### Direct Connection Access

Access the underlying Kuzu connection when needed:

```typescript
const conn = client.connection;

// Use native Kuzu API directly
const preparedStatement = await conn.prepare("MATCH (p:Person) RETURN p");
const result = await conn.execute(preparedStatement);
```

## Common Patterns

### Creating Schema

Schema definitions are static, so use `queryRaw` methods:

```typescript
// Create node tables
await client.queryRaw`
  CREATE NODE TABLE Person(
    name STRING,
    age INT32,
    email STRING,
    PRIMARY KEY (name)
  )
`;

await client.queryRaw`
  CREATE NODE TABLE City(
    name STRING,
    country STRING,
    PRIMARY KEY (name)
  )
`;

// Create relationship tables
await client.queryRaw`
  CREATE REL TABLE LIVES_IN(FROM Person TO City, since INT32)
`;

await client.queryRaw`
  CREATE REL TABLE KNOWS(FROM Person TO Person, since STRING)
`;
```

### Inserting Data

Use parameterized queries for dynamic values:

```typescript
// Insert nodes with parameters
const name = "Alice";
const age = 30;
const email = "alice@example.com";
await client.query`CREATE (p:Person {name: ${name}, age: ${age}, email: ${email}})`;

const cityName = "New York";
const country = "USA";
await client.query`CREATE (c:City {name: ${cityName}, country: ${country}})`;

// Insert relationships with parameters
const personName = "Alice";
const targetCity = "New York";
const since = 2020;
await client.query`
  MATCH (p:Person), (c:City)
  WHERE p.name = ${personName} AND c.name = ${targetCity}
  CREATE (p)-[:LIVES_IN {since: ${since}}]->(c)
`;
```

### Querying Data

Use parameterized queries for filtering and searching:

```typescript
// Find all people living in a city with age filter
const minAge = 25;
const residents = await client.queryAll<{
  personName: string;
  cityName: string;
  since: number;
}>`
  MATCH (p:Person)-[l:LIVES_IN]->(c:City)
  WHERE p.age > ${minAge}
  RETURN p.name as personName, c.name as cityName, l.since as since
`;

// Find paths between people
const person1 = "Alice";
const person2 = "Bob";
const paths = await client.queryAll<{
  path: KuzuClient.Data.Path<PersonNode, KnowsRel>;
}>`
  MATCH path = (a:Person)-[:KNOWS*1..3]-(b:Person)
  WHERE a.name = ${person1} AND b.name = ${person2}
  RETURN path
`;
```

### Updating Data

Use parameterized queries for updates:

```typescript
// Update node properties
const name = "Alice";
const newAge = 31;
await client.query`
  MATCH (p:Person {name: ${name}})
  SET p.age = ${newAge}
`;

// Update relationship properties
const person1 = "Alice";
const person2 = "Bob";
const strength = 10;
await client.query`
  MATCH (p:Person)-[k:KNOWS]->(f:Person)
  WHERE p.name = ${person1} AND f.name = ${person2}
  SET k.strength = ${strength}
`;
```

### Deleting Data

Use parameterized queries for deletions:

```typescript
// Delete relationships
const name1 = "Alice";
const name2 = "Bob";
await client.query`
  MATCH (p:Person)-[k:KNOWS]->(f:Person)
  WHERE p.name = ${name1} AND f.name = ${name2}
  DELETE k
`;

// Delete nodes (must delete relationships first)
const nameToDelete = "Alice";
await client.query`
  MATCH (p:Person {name: ${nameToDelete}})
  DELETE p
`;
```

## API Reference

### KuzuClient

Main client class for interacting with Kuzu database.

#### Safe Query Methods (Recommended)

Use prepared statements with parameter binding:

- **`query<T>(template, ...args)`** - Execute a parameterized query and return QueryResult
- **`queryAll<T>(template, ...args)`** - Execute a parameterized query and return all results as array
- **`queryOne<T>(template, ...args)`** - Execute a parameterized query and return first result
- **`queryIterator<T>(template, ...args)`** - Execute a parameterized query and return async iterator

#### Raw Query Methods (Static Queries Only)

Direct string interpolation without parameter binding:

- **`queryRaw<T>(template, ...args)`** - Execute a raw query and return QueryResult
- **`queryRawAll<T>(template, ...args)`** - Execute a raw query and return all results as array
- **`queryRawOne<T>(template, ...args)`** - Execute a raw query and return first result
- **`queryRawIterator<T>(template, ...args)`** - Execute a raw query and return async iterator

#### Lifecycle Methods

- **`init()`** - Manually initialize the database (auto-initialized on first query)
- **`close()`** - Close database connection and release resources

#### Extension Methods

- **`getLoadedExtensions()`** - Get list of loaded extensions
- **`loadExtension(name)`** - Load a Kuzu extension

#### Properties

- **`connection`** - Get raw Kuzu connection instance
- **`dbFile`** - Get FsFile instance for the database file

### Types

#### KuzuClient.Options

Configuration options for creating a client:
- `path` - Path to database file (string or FsFile)
- `createIfNotExists` - Create database if it doesn't exist
- `enableCompression` - Enable compression
- `readonly` - Open in read-only mode
- `bufferManagerSize` - Buffer manager size in bytes
- `maxDBSize` - Maximum database size in bytes
- `autoCheckpoint` - Enable auto-checkpointing
- `checkpointThreshold` - Checkpoint threshold

#### KuzuClient.Data

Type definitions for graph data structures:
- `Node<LABEL, DATA>` - Graph node with label and properties
- `Relationship<LABEL, DATA>` - Graph relationship with label and properties
- `Path<NODE, RELATIONSHIP>` - Path through the graph
- `Id` - Internal node/relationship identifier

## About Kuzu

[Kuzu](https://kuzudb.com/) is an embedded graph database built for query speed and scalability. It supports:

- **Cypher query language** - Industry-standard graph query language
- **ACID transactions** - Full transactional support
- **High performance** - Optimized for graph analytics
- **Embedded** - No separate server process required
- **Open source** - Apache 2.0 licensed

Learn more at [kuzudb.com](https://kuzudb.com/).