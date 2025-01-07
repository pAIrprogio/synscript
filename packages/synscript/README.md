# @synstack/synscript

Bundle package for Synstack libraries, your core stack for AI scripting and workflow automation.

## Installation

```bash
npm install @synstack/synscript
# or
yarn add @synstack/synscript
# or
pnpm add @synstack/synscript
```

## Available Libraries

### Main libraries

- [`llm`](../llm/README.md): Immutable, chainable, and type-safe wrapper of Vercel's AI SDK
- [`dir`, `file`, `files`](../fs/README.md): File system operations with support for multiple formats
- [`fsCache`](../fs-cache/README.md): Human-friendly file system caching
- [`t`, `tIf`](../text/README.md): String templating utilities
- [`web`](../web/README.md): Web utilities for scraping and fetching content

### Core Utilities

- [`enhance`](../enhance/README.md): Type-safe object enhancement with proxy-based method extension
- [`pipe`](../pipe/README.md): Type-safe chainable operations with immutable transformations
- [`resolved`](../resolved/README.md): Type-safe piping of synchronous or asynchronous values

### Other File System Utilities

- [`git`](../git/README.md): Git utilities for AI prompting and automation
- [`glob`](../glob/README.md): Type-safe glob pattern matching and file filtering
- [`path`](../path/README.md): Type-safe path manipulation utilities

### Content Processing

- [`json`](../json/README.md): Schema-safe JSON serialization and deserialization
- [`yaml`](../yaml/README.md): Type-safe YAML serialization and deserialization
- [`xml`](../xml/README.md): Non-iso XML parser with text preservation
- [`md`](../markdown/README.md): Type-safe markdown processing with YAML frontmatter
- [`str`](../str/README.md): Advanced chainable string manipulation utilities

## Usage Example

```typescript
import { dir, t, str } from "@synstack/synscript";

// File operations
const sourceDir = dir("./src");
const files = await sourceDir.glob("**/*.ts");

// String manipulation
const content = str("hello-world").pascalCase().$; // "HelloWorld"

// Text templating
const text = await t`
  Found ${files.length} TypeScript files:
    ${files.map((f) => `- ${f.path}`)}
`;
```