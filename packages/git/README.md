# @synstack/git

> Helpful Git utilities for AI prompting and automation

This package provides a small set of Git operations commonly needed when working with AI tools and automation scripts.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## What is it for?

When working with AI tools or automation scripts, you often need to get information about your Git repository. This package provides simple utilities for common tasks:

```typescript
import { ls, show } from "@synstack/git";

// Get all relevant files in your project
const files = await ls();

// View specific commit changes
const commitDetails = await show("449b7730436026243936a0a2f37c6d3474fcad3b");
```

## Installation

```bash
npm install @synstack/git
# or
yarn add @synstack/git
# or
pnpm add @synstack/git
```

## Features

- 🔍 Smart file listing that includes tracked, modified, and untracked files
- 📜 Easy access to commit details and changes
- 🎯 Respects .gitignore rules
- 🔄 Promise-based for modern JavaScript
- ⚡ Minimal and focused API

## API Reference

### Functions

#### `ls(cwd?: string, relativePath?: string): Promise<string[]>`

Get a comprehensive list of files in your repository. Perfect for gathering context for AI tools.

- `cwd`: Working directory (defaults to ".")
- `relativePath`: Path relative to the working directory (defaults to ".")
- Returns: Array of file paths, including:
  - Tracked files
  - Modified files
  - Untracked files (respecting .gitignore)

```typescript
const files = await ls("./my-repo");
// Returns: ['README.md', 'src/index.ts', ...]
```

#### `show(commitId: string, cwd?: string): Promise<string>`

Get the full details of a specific commit, including the commit message and changes.

- `commitId`: The commit hash to show
- `cwd`: Working directory (defaults to ".")
- Returns: Commit details as a string

```typescript
const commit = await show("449b7730436026243936a0a2f37c6d3474fcad3b");
// Returns the full commit message and changes
```

## License

Apache-2.0
