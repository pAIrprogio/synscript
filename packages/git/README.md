# @synstack/git

> Git operations with TypeScript support

This package provides a strongly-typed interface for common Git operations, making it easy to interact with Git repositories programmatically.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## What is it for?

When you need to interact with Git repositories programmatically, this package provides a simple and type-safe way to perform common Git operations:

```typescript
import { ls } from "@synstack/git";

// List all files in the repository (tracked, modified, and untracked)
const files = await ls("./my-repo");
console.log(files);
// [
//   "src/index.ts",
//   "package.json",
//   "README.md",
//   "new-file.txt"  // untracked
// ]
```

## Installation

```bash
# Using npm
npm install @synstack/git

# Using yarn
yarn add @synstack/git

# Using pnpm
pnpm add @synstack/git
```

## Features

### File Listing

List all files in a Git repository, including:
- Tracked files
- Modified files
- Untracked files (respecting .gitignore)

```typescript
import { ls } from "@synstack/git";

// List files in current directory
const files = await ls();

// List files in specific directory
const repoFiles = await ls("./my-repo");

// List files in specific subdirectory
const srcFiles = await ls("./my-repo", "src");
```

## API Reference

### Functions

#### `ls(cwd?: string, relativePath?: string): Promise<string[]>`

Lists all Git-tracked, modified, and untracked files.

- **Parameters:**
  - `cwd` (optional): Working directory for Git commands (defaults to ".")
  - `relativePath` (optional): Path relative to working directory to list files from (defaults to ".")
- **Returns:** Promise resolving to array of file paths
- **Example:**
  ```typescript
  const files = await ls("./repo", "src");
  // ["src/index.ts", "src/utils.ts"]
  ```

## TypeScript Support

This package is written in TypeScript and provides full type definitions:
- Type-safe function parameters
- IntelliSense support for all functions
- Strongly typed return values

## License

Apache-2.0 - see LICENSE file for details.
