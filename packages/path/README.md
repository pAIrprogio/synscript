# @synstack/path

Type-safe path manipulation utilities

> [!WARNING]
> This package is included in the [@synstack/synscript](../synscript/README.md) package. It is not recommended to install both packages at the same time.

## What is it for?

This package provides a strongly-typed interface for working with file system paths, ensuring type safety between absolute and relative paths:

```typescript
import { path } from "@synstack/path";

// Type-safe path resolution
const absolutePath = path.resolve("/base", "subdir", "file.txt");
console.log(absolutePath); // "/base/subdir/file.txt"

// Path type checking
const isAbs = path.isAbsolute("/absolute/path"); // true
const isAbs2 = path.isAbsolute("relative/path"); // false

// Path manipulation
const dirName = path.dirname("/path/to/file.txt"); // "/path/to"
const relativePath = path.relative("/base/dir", "/base/dir/subdir/file.txt"); // "subdir/file.txt"
```

## Installation

```bash
# Using npm
npm install @synstack/path

# Using yarn
yarn add @synstack/path

# Using pnpm
pnpm add @synstack/path
```

## Features

### Type-Safe Paths

The package provides type definitions for different kinds of paths:

```typescript
import type { AbsolutePath, RelativePath, AnyPath } from "@synstack/path";

// Type-safe path handling
function processPath(path: AbsolutePath) {
  // Only absolute paths are accepted
}

function processRelative(path: RelativePath) {
  // Only relative paths are accepted
}

function processAny(path: AnyPath) {
  // Any path type is accepted
}
```

### Path Operations

#### Path Resolution and Validation

```typescript
import { path } from "@synstack/path";

// Resolve paths
const abs = path.resolve("relative/path"); // Converts to absolute path
const isAbs = path.isAbsolute("/some/path"); // Check if path is absolute
const dir = path.dirname("/path/to/file.txt"); // Get directory name
```

#### Path Relationships

```typescript
// Check path containment
path.isInPath("/base", "/base/subdir"); // true
path.isInPath("/base", "/other"); // false

// Create relative paths
path.relative("/base/dir", "/base/dir/subdir/file.txt"); // "subdir/file.txt"
```

#### Path Joining and Manipulation

```typescript
// Join paths
path.join("/absolute", "path", "file.txt"); // "/absolute/path/file.txt"
path.join("relative", "path", "file.txt"); // "relative/path/file.txt"

// Remove relative indicators
path.removeRelativeIndicator("./file.txt"); // "file.txt"
```

#### File Extensions

```typescript
// Add or ensure extensions
path.addMissingExtension("/path/to/file", "txt"); // "/path/to/file.txt"
path.ensureFileExtension("/path/to/file", ".txt"); // "/path/to/file.txt"

// Get file information
path.filename("/path/to/file.txt"); // "file.txt"
path.filenameWithoutExtension("/path/to/file.txt"); // "file"
path.fileExtension("/path/to/file.txt"); // ".txt"
```

#### MIME Types

```typescript
// Get MIME type from path
path.mimeType("/path/to/image.png"); // "image/png"
path.mimeType("/path/to/unknown"); // null
```

#### ES Module Support

```typescript
// Convert import URLs to file system paths
const dirPath = path.importUrlToAbsolutePath(import.meta.url);
```

## Error Handling

The package includes custom error types for specific path-related issues:

```typescript
import { PathNotInCwdException } from "@synstack/path";

try {
  // Operations that might throw PathNotInCwdException
} catch (error) {
  if (error instanceof PathNotInCwdException) {
    console.error(
      "Path operation outside current working directory:",
      error.message,
    );
  }
}
```
