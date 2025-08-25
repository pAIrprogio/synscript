# @synstack/pattern

Pattern-based configuration engine with query matching capabilities

## What is it for?

This package provides a powerful pattern engine that allows you to organize configuration data in markdown files and query them using sophisticated matching logic. It's perfect for creating rule-based systems, configuration hierarchies, and pattern-matching workflows.

```typescript
import { PatternEngine } from "@synstack/pattern";
import { dir } from "@synstack/fs";
import { z } from "zod";

// Create a pattern engine for a directory containing .md pattern files
const engine = PatternEngine.cwd(dir("./patterns"));

// Find all patterns that match specific input
const matchingPatterns = await engine.matchingPatterns(inputData);

// Get pattern names that match
const patternNames = await engine.matchingPatternNames(inputData);

// Get a specific pattern by name
const pattern = await engine.getPatternByName("complex/with-query");
```

## Installation

```bash
# Using npm
npm install @synstack/pattern @synstack/query zod

# Using yarn
yarn add @synstack/pattern @synstack/query zod

# Using pnpm
pnpm add @synstack/pattern @synstack/query zod
```

## Features

### Pattern Organization

Patterns are organized as markdown files with YAML frontmatter containing configuration data and queries:

#### Basic Pattern Example

```markdown
---
query:
  always: true
---

# Simple Pattern

This is a basic pattern that always matches any input.
```

#### Complex Query Pattern

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

This pattern matches React component files that:
- Contain the word 'component' in their path or content
- Have either .tsx or .jsx extension
- Do not contain 'deprecated' in their path or content
```

#### Hierarchical Pattern Example

```markdown
---
query:
  contains: 'test1'
metadata:
  category: "testing"
  level: 1
---

# Level 1 Test Pattern

Pattern that matches when input contains "test1".
This pattern inherits from parent patterns in the directory hierarchy.
```

### Pattern Directory Structure

Organize your patterns in a directory structure like this:

```
patterns/
├── simple/
│   └── basic.md              # Pattern name: "simple/basic"
├── complex/
│   └── with-query.md         # Pattern name: "complex/with-query"
├── components/
│   ├── 0.components.md       # Pattern name: "components" (numeric prefix removed)
│   ├── button/
│   │   ├── 0.button.md       # Pattern name: "components/button"
│   │   ├── primary.md        # Pattern name: "components/button/primary"
│   │   └── button.theme.md   # Pattern name: "components/button" (type: "theme")
│   └── form/
│       ├── input.md          # Pattern name: "components/form/input"
│       └── input.validation.md # Pattern name: "components/form/input" (type: "validation")
├── nested/
│   └── level1/
│       ├── level1.md         # Pattern name: "nested/level1/level1"
│       └── pattern1.md       # Pattern name: "nested/level1/pattern1"
└── user/
    ├── active.md             # Pattern name: "user/active"
    ├── inactive.md           # Pattern name: "user/inactive"
    └── user.permissions.md   # Pattern name: "user" (type: "permissions")
```

### Pattern Naming

Pattern files are automatically named based on their directory structure and filename:

- `patterns/user/active.md` → Pattern name: `user/active`
- `patterns/complex/with-query.md` → Pattern name: `complex/with-query` 
- `patterns/nested/level1/pattern1.md` → Pattern name: `nested/level1/pattern1`

#### Numeric Prefix Handling

Numeric prefixes are automatically removed from filenames to allow for ordering:

- `patterns/components/0.components.md` → Pattern name: `components`
- `patterns/components/button/0.button.md` → Pattern name: `components/button`
- `patterns/components/button/primary.md` → Pattern name: `components/button/primary`

This allows you to control the processing order of patterns while keeping clean, meaningful names.

#### Type Suffix Support

Pattern files can include type suffixes for categorization:

- `patterns/button.primary.md` → Pattern name: `button` (type: `primary`)
- `patterns/form.validation.md` → Pattern name: `form` (type: `validation`)

The type information is available in the pattern metadata for advanced filtering and organization.

### Query Integration

The pattern engine integrates with `@synstack/query` for sophisticated matching:

```typescript
import { QueryEngine } from "@synstack/query";

// Set up custom query engine with predicates
const queryEngine = QueryEngine
  .addPredicate("status", z.string(), (status) => (input) => input.status === status)
  .addPredicate("priority", z.number(), (priority) => (input) => input.priority >= priority);

// Apply custom query engine to pattern engine
const engine = PatternEngine
  .cwd(dir("./patterns"))
  .setQueryEngine(queryEngine);
```

### Pattern Inheritance

Patterns support hierarchical inheritance where parent patterns are automatically applied:

```typescript
// Get parent patterns for a specific pattern
const parentPatterns = await engine.getParentPatterns("nested/level1/pattern1");

// Parent patterns are automatically combined during matching
const matches = await engine.matchingPatterns(inputData);
```

### Schema Validation

Configure custom schema validation for pattern data:

```typescript
const customSchema = z.object({
  query: z.any(), // Query schema from the engine
  title: z.string(),
  priority: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

const typedEngine = engine.setConfigSchema(customSchema);
const patterns = await typedEngine.getPatterns(); // Fully typed patterns
```

### Pattern Management

```typescript
// Get all patterns
const allPatterns = await engine.getPatterns();

// Get patterns as a map for quick lookup
const patternsMap = await engine.getPatternsMap();

// Refresh patterns from filesystem
await engine.refreshPatterns();

// Get schema information
const schema = engine.schema;
const jsonSchema = engine.jsonSchema;
```

## API Reference

### PatternEngine

#### Static Methods

- `PatternEngine.cwd(dir)` - Create a pattern engine for a directory

#### Instance Methods

- `setQueryEngine(queryEngine)` - Set custom query engine for matching
- `setConfigSchema(schema)` - Set custom schema for pattern validation
- `getPatterns()` - Get all patterns
- `getPatternsMap()` - Get patterns as a Map for quick lookup
- `getPatternByName(name)` - Get a specific pattern by name
- `getParentPatterns(patternName)` - Get parent patterns for hierarchical matching
- `matchingPatterns(input)` - Find patterns that match the input
- `matchingPatternNames(input)` - Get names of matching patterns
- `refreshPatterns()` - Reload patterns from filesystem
- `query` - Access the underlying query engine
- `schema` - Get the configuration schema
- `jsonSchema` - Get JSON schema representation

### Type Definitions

```typescript
// Infer configuration type from engine
type Config = PatternEngine.Config.Infer<typeof engine>;

// Infer pattern type from engine  
type Pattern = PatternEngine.Pattern.Infer<typeof engine>;
```