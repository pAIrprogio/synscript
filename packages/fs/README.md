# @synstack/fs

> File system operations made easy

This package provides a strongly-typed, chainable API for file system operations with support for multiple formats and advanced path manipulation.

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## What is it for?

Working with files and directories should be simple and type-safe. This package turns verbose file operations into chainable, strongly-typed commands:

```typescript
import { file, dir } from "@synstack/fs";

// Read and validate JSON with schema
const configFile = file("./config.json")
  .schema(ConfigSchema)
  .read.json();

// Write text files with different encodings
const templateFile = file("./template.txt")
  .write.text("Hello ${name}!");

// Find and filter files by glob patterns and MIME types
const images = dir("./assets")
  .glob("**/*.{png,jpg}")
  .filterMimeTypes("image/png", "image/jpeg");

// Work with relative paths safely
const sourceFile = file("/path/to/source.ts");
const targetFile = sourceFile
  .toFile("../dist/output.js")
  .write.text(compiledContent);

// Handle JSON with pretty formatting
const packageJson = file("package.json")
  .write.prettyJson({
    name: "@my/package",
    version: "1.0.0"
  });
```

## Installation

```bash
# Using npm
npm install @synstack/fs

# Using yarn
yarn add @synstack/fs

# Using pnpm
pnpm add @synstack/fs
```

## Features

### File Operations (FsFile)

Create and work with files using the `file()` function:

```typescript
import { file } from "@synstack/fs";

// Create a file instance
const myFile = file("/path/to/file.txt");

// Read operations
const content = await myFile.read.text();
const data = await myFile.read.json();
const yamlConfig = await myFile.read.yaml();
const xmlDoc = await myFile.read.xml();
const imageData = await myFile.read.base64();

// Write operations
await myFile.write.text("Hello World");
await myFile.write.json({ hello: "world" });
await myFile.write.yaml({ config: true });
await myFile.write.base64(imageData);

// Path operations
const extension = myFile.fileExtension();     // ".txt"
const name = myFile.fileName();               // "file.txt"
const nameOnly = myFile.fileNameWithoutExtension(); // "file"
const type = myFile.mimeType();              // "text/plain"

// File management
await myFile.exists();  // Check if file exists
await myFile.rm();      // Delete file
```

### Directory Operations (FsDir)

Work with directories using the `dir()` function:

```typescript
import { dir } from "@synstack/fs";

// Create a directory instance
const myDir = dir("/path/to/directory");

// Directory operations
await myDir.make();    // Create directory
await myDir.exists();  // Check if exists
await myDir.rm();      // Remove directory

// File operations within directory
const configFile = myDir.file("config.json");
const subDir = myDir.to("subdirectory");

// Find files using glob patterns
const tsFiles = await myDir.glob("**/*.ts");
const [cssFiles, jsFiles] = await myDir.glob(["**/*.css", "**/*.js"]);

// Git integration
const trackedFiles = await myDir.gitLs();  // List git-tracked files
```

### File Array Operations (FsFileArray)

Work with collections of files using powerful array methods:

```typescript
import { dir } from "@synstack/fs";

const sourceDir = dir("./src");
const files = await sourceDir.glob("**/*");

// Filter files
const tsFiles = files.filterGlobs("**/*.ts");
const imageFiles = files.filterMimeTypes("image/png", "image/jpeg");
const testFiles = files.filter(file => file.fileName().endsWith(".test.ts"));

// Path operations
const relativePaths = files.relativePathsTo(sourceDir);
const absolutePaths = files.toPaths();
```

## API Reference

### FsFile

The `FsFile` class provides methods for working with individual files:

#### Creation
- `file(...paths)` - Create a new file instance from path segments
- `schema(zodSchema)` - Add schema validation for JSON/YAML operations

#### Read Operations
- `read.text()` - Read file as text
- `read.json()` - Read and parse JSON file
- `read.yaml()` - Read and parse YAML file
- `read.xml()` - Read and parse XML file
- `read.base64()` - Read file as base64
- `read.base64Data()` - Read file as base64 with MIME type

#### Write Operations
- `write.text(content)` - Write text to file
- `write.json(data)` - Write JSON to file
- `write.prettyJson(data)` - Write formatted JSON
- `write.yaml(data)` - Write YAML to file
- `write.base64(data)` - Write base64 data

#### Path Operations
- `path` - Get absolute path
- `dirPath()` - Get directory path
- `dir()` - Get directory instance
- `fileName()` - Get file name
- `fileExtension()` - Get file extension
- `fileNameWithoutExtension()` - Get name without extension
- `mimeType()` - Get MIME type
- `toFile(relativePath)` - Create new file relative to this one
- `toDir(relativePath)` - Create new directory relative to this one
- `relativePathFrom(dirOrFile)` - Get relative path from another location
- `relativePathTo(dirOrFile)` - Get relative path to another location

#### File Management
- `exists()` - Check if file exists
- `rm()` - Delete file
- `matchesGlobs(...patterns)` - Check if file matches glob patterns
- `globCapture(pattern)` - Capture parts of path using glob pattern

### FsDir

The `FsDir` class provides methods for working with directories:

#### Creation
- `dir(...paths)` - Create new directory instance
- `to(relativePath)` - Create new subdirectory instance
- `file(relativePath)` - Create new file instance in directory

#### Directory Operations
- `exists()` - Check if directory exists
- `make()` - Create directory
- `rm()` - Remove directory and contents
- `name()` - Get directory name

#### File Finding
- `glob(...patterns)` - Find files using glob patterns
- `gitLs(subPath?)` - List git-tracked files

### FsFileArray

Methods available on arrays of files:

#### Filtering
- `filter(fn)` - Filter files using predicate
- `filterGlobs(...patterns)` - Filter by glob patterns
- `filterMimeTypes(...types)` - Filter by MIME types
- `filterDir(dirOrPath)` - Filter files in directory

#### Path Operations
- `toPaths()` - Get array of absolute paths
- `relativePathsTo(dirOrFile)` - Get array of relative paths

## TypeScript Support

This package is written in TypeScript and provides full type definitions. It includes:

- Generic type parameters for file encodings
- Zod schema validation for JSON/YAML operations
- Type-safe path operations
- Strongly typed array methods

## License

Apache-2.0 - see LICENSE file for details.
