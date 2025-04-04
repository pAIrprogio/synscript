# @synstack/synscript

> [!WARNING] The `@synstack/synscript` which includes all the packages is being deprecated.
>
> We recommend installing individual packages instead.

## Installations

Core installation with most used packages:

```bash
npm install @synstack/llm @synstack/fs @synstack/text @synstack/fs-cache @synstack/xml

yarn add @synstack/llm @synstack/fs @synstack/text @synstack/fs-cache @synstack/xml

pnpm add @synstack/llm @synstack/fs @synstack/text @synstack/fs-cache @synstack/xml
```

## Available Libraries

### Main libraries

- [`@synstack/llm`](../llm/README.md): Immutable, chainable, and type-safe wrapper of Vercel's AI SDK
- [`@synstack/fs`](../fs/README.md): File system operations with support for multiple formats
- [`@synstack/fs-cache`](../fs-cache/README.md): Human-friendly file system caching
- [`@synstack/text`](../text/README.md): String templating utilities
- [`@synstack/web`](../web/README.md): Web utilities for scraping and fetching content

### Core Utilities

- [`@synstack/enhance`](../enhance/README.md): Type-safe object enhancement with proxy-based method extension
- [`@synstack/pipe`](../pipe/README.md): Type-safe chainable operations with immutable transformations
- [`@synstack/resolved`](../resolved/README.md): Type-safe piping of synchronous or asynchronous values

### Other File System Utilities

- [`@synstack/git`](../git/README.md): Git utilities for AI prompting and automation
- [`@synstack/glob`](../glob/README.md): Type-safe glob pattern matching and file filtering
- [`@synstack/path`](../path/README.md): Type-safe path manipulation utilities

### Content Processing

- [`@synstack/json`](../json/README.md): Schema-safe JSON serialization and deserialization
- [`@synstack/yaml`](../yaml/README.md): Type-safe YAML serialization and deserialization
- [`@synstack/xml`](../xml/README.md): Non-iso XML parser with text preservation
- [`@synstack/markdown`](../markdown/README.md): Type-safe markdown processing with YAML frontmatter
- [`@synstack/str`](../str/README.md): Advanced chainable string manipulation utilities
