# @synstack/markdown-db

Markdown database engine with query matching capabilities

## What is it for?
- Matches markdown files based on provided entry data
- Supports hierarchical entry inheritance
- Supports custom query engines and schema validation

```typescript
import { MarkdownDb } from "@synstack/markdown-db";
import { fsDir } from "@synstack/fs";
import { z } from "zod";

// Create a markdown database for a directory containing .md files
const engine = MarkdownDb.cwd(fsDir("./entries"));

// Find all entries that match specific input
const matchingEntries = await engine.match(inputData);

// Match multiple inputs and get deduplicated results sorted by file path
const allMatches = await engine.matchAll([inputData1, inputData2]);

// Get a specific entry by id
const entry = await engine.getEntryById("complex/with-query");
```

## Installation

```bash
# Using npm
npm install @synstack/markdown-db @synstack/query zod

# Using yarn
yarn add @synstack/markdown-db @synstack/query zod

# Using pnpm
pnpm add @synstack/markdown-db @synstack/query zod
```

## Features

### Entry Organization

Entries are organized as markdown files with YAML frontmatter containing configuration data and queries:

#### Basic Entry Example

```markdown
---
query:
  always: true
---

# Simple Entry

This is a basic entry that always matches any input.
```

#### Complex Query Entry

```markdown
---
query:
  and:
    - contains: 'component'
    - or:
        - hasExtension: ['tsx']
        - hasExtension: ['jsx']
    - not:
        contains: 'deprecated'
title: "React Component Pattern"
priority: 1
---

# React Component Detection

This entry matches React component files that:
- Contain the word 'component' in their path or content
- Have either .tsx or .jsx extension
- Do not contain 'deprecated' in their path or content
```

#### Hierarchical Entry Example

```markdown
---
query:
  contains: 'test1'
metadata:
  category: "testing"
  level: 1
---

# Level 1 Test Pattern

Entry that matches when input contains "test1".
This entry inherits from parent entries in the directory hierarchy.
```

### Entry Directory Structure

Organize your entries in a directory structure like this:

```
entries/
├── simple/
│   └── basic.md              # Entry ID: "simple/basic"
├── complex/
│   └── with-query.md         # Entry ID: "complex/with-query"
├── components/
│   ├── 0.components.md       # Entry ID: "components" (numeric prefix removed)
│   ├── button/
│   │   ├── 0.button.md       # Entry ID: "components/button"
│   │   ├── primary.md        # Entry ID: "components/button/primary"
│   │   └── button.theme.md   # Entry ID: "components/button" (type: "theme")
│   └── form/
│       ├── input.md          # Entry ID: "components/form/input"
│       └── input.validation.md # Entry ID: "components/form/input" (type: "validation")
├── nested/
│   └── level1/
│       ├── level1.md         # Entry ID: "nested/level1/level1"
│       └── pattern1.md       # Entry ID: "nested/level1/pattern1"
└── user/
    ├── active.md             # Entry ID: "user/active"
    ├── inactive.md           # Entry ID: "user/inactive"
    └── user.permissions.md   # Entry ID: "user" (type: "permissions")
```

### Entry Naming

Entry files are automatically named based on their directory structure and filename:

- `entries/user/active.md` → Entry ID: `user/active`
- `entries/complex/with-query.md` → Entry ID: `complex/with-query` 
- `entries/nested/level1/pattern1.md` → Entry ID: `nested/level1/pattern1`

#### Numeric Prefix Handling

Numeric prefixes are automatically removed from filenames to allow for ordering:

- `entries/components/0.components.md` → Entry ID: `components`
- `entries/components/button/0.button.md` → Entry ID: `components/button`
- `entries/components/button/primary.md` → Entry ID: `components/button/primary`

This allows you to control the processing order of entries while keeping clean, meaningful names.

#### Type Suffix Support

Entry files can include type suffixes for categorization:

- `entries/button.primary.md` → Entry ID: `button` (type: `primary`)
- `entries/form.validation.md` → Entry ID: `form` (type: `validation`)

The type information is available in the entry metadata for advanced filtering and organization.

### Query Integration

The markdown database engine integrates with `@synstack/query` for sophisticated matching:

```typescript
import { QueryEngine } from "@synstack/query";

// Set up custom query engine with predicates
const queryEngine = QueryEngine
  .addPredicate("status", z.string(), (status) => (input) => input.status === status)
  .addPredicate("priority", z.number(), (priority) => (input) => input.priority >= priority);

// Apply custom query engine to markdown database
const engine = MarkdownDb
  .cwd(dir("./entries"))
  .setQueryEngine(queryEngine);
```

### Entry Inheritance

Entries support hierarchical inheritance where parent entries are automatically applied:

```typescript
// Get parent entries for a specific entry
const parentEntries = await engine.getParentEntries("nested/level1/pattern1");

// Parent entries are automatically combined during matching
const matches = await engine.match(inputData);
```

### Schema Validation

Configure custom schema validation for entry data:

```typescript
const customSchema = z.object({
  query: z.any(), // Query schema from the engine
  title: z.string(),
  priority: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

const typedEngine = engine.setConfigSchema(customSchema);
const entries = await typedEngine.getEntries(); // Fully typed entries
```

### Entry Management

```typescript
// Get all entries
const allEntries = await engine.getEntries();

// Get entries as a map for quick lookup
const entriesMap = await engine.getEntriesMap();

// Refresh entries from filesystem
await engine.refreshEntries();

// Get schema information
const schema = engine.schema;
const jsonSchema = engine.jsonSchema;
```

## API Reference

### MarkdownDb

#### Static Methods

- `MarkdownDb.cwd(dir)` - Create a markdown database for a directory

#### Instance Methods

- `setQueryEngine(queryEngine)` - Set custom query engine for matching
- `setConfigSchema(schema)` - Set custom schema for entry validation
- `getEntries()` - Get all entries
- `getEntriesMap()` - Get entries as a Map for quick lookup
- `getEntryById(id)` - Get a specific entry by ID
- `getParentEntries(entryId)` - Get parent entries for hierarchical matching
- `match(input)` - Find entries that match the input
- `matchAll(inputs)` - Find entries that match any of the inputs (deduplicated and sorted)
- `refreshEntries()` - Reload entries from filesystem
- `query` - Access the underlying query engine
- `schema` - Get the configuration schema
- `jsonSchema` - Get JSON schema representation

### Type Definitions

```typescript
// Infer configuration type from engine
type Config = MarkdownDb.Config.Infer<typeof engine>;

// Infer entry type from engine  
type Entry = MarkdownDb.Entry.Infer<typeof engine>;
```