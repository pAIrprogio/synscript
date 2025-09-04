# @synstack/fs

> File system operations made easy

This package provides a strongly-typed, chainable, and immutable API for file system operations with support for multiple formats and advanced path manipulation.

## What is it for?

Turn verbose file operations into chainable, immutable, and strongly-typed commands:

```typescript
import { fsDir } from "@synstack/fs";

// Chain directory and file operations
const srcDir = fsDir("./src");

// Recursively create directories
await srcDir.to("dist/assets/images").make();

// Validate data files with zod schemas
const configFile = srcDir.file("config.json").schema(configSchema);

await configFile.write.prettyJson({
  name: "my-app",
  version: "1.0.0",
  settings: {
    port: 3000,
    debug: true,
  },
});

const config = await configFile.read.json(); // A fully typed json object

// Chain file operations from directory
const config = await srcDir
  .file("config.json")
  .schema(configSchema)
  .read.json(); // A fully typed json object

// Chain directory traversal and file operations
const buttonCss = await srcDir
  .to("components") // Navigate to subdirectory
  .file("Button.tsx")
  .dir() // Get parent directory
  .file("Button.css") // Get sibling file
  .read.text();

// Chain directory creation and file operations
await srcDir
  .to("dist/assets/images") // Navigate to nested path
  .file("logo.png") // Reference file in new directory
  .write.base64(imageData);
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

#### Basic Operations

```typescript
import { fsFile } from "@synstack/fs";

// Create a file instance
const myFile = fsFile("/path/to/file.txt");

// Check file existence
await myFile.exists(); // Promise<boolean>
myFile.existsSync(); // boolean

// Delete file
await myFile.remove();
myFile.removeSync();

// Move file
await myFile.move("/new/path/file.txt");
myFile.moveSync("/new/path/file.txt");

// Get file metadata
await myFile.creationDate(); // Promise<Date>
myFile.creationDateSync(); // Date
```

#### Path Operations

```typescript
const myFile = fsFile("/path/to/file.txt");

// Get path information
myFile.path; // "/path/to/file.txt"
myFile.dirPath(); // "/path/to"
myFile.dir(); // FsDir instance
myFile.fileName(); // "file.txt"
myFile.fileExtension(); // ".txt"
myFile.fileNameWithoutExtension(); // "file"
myFile.mimeType(); // "text/plain"

// Path manipulation
myFile.toFile("../other.txt"); // New FsFile instance
myFile.toDir("../other"); // New FsDir instance
myFile.relativePathFrom(otherFile); // Relative path from other file
myFile.relativePathTo(otherFile); // Relative path to other file
myFile.isInDir(someDir); // Check if file is in directory
```

#### Read Operations

```typescript
// Text reading
await myFile.read.text(); // string
myFile.read.textSync(); // string
await myFile.read.str(); // Enhanced string
myFile.read.strSync(); // Enhanced string

// Structured data
await myFile.read.json<T>(); // T
myFile.read.jsonSync<T>(); // T
await myFile.read.yaml<T>(); // T
myFile.read.yamlSync<T>(); // T
await myFile.read.xml<T>(); // T
myFile.read.xmlSync<T>(); // T

// Binary data
await myFile.read.base64(); // string
myFile.read.base64Sync(); // string
await myFile.read.base64Data(); // Base64Data
myFile.read.base64DataSync(); // Base64Data
```

#### Write Operations

> [!NOTE]
> Any write operation will create the parent directories recursively if they do not exist. No need to call `make()` on the parent directory beforehand.

```typescript
// Text writing
await myFile.write.text("content");
myFile.write.textSync("content");

// Structured data
await myFile.write.json({ data: true });
myFile.write.jsonSync({ data: true });
await myFile.write.prettyJson({ data: true });
myFile.write.prettyJsonSync({ data: true });
await myFile.write.yaml({ data: true });
myFile.write.yamlSync({ data: true });

// Binary data
await myFile.write.base64(base64String);
myFile.write.base64Sync(base64String);

// Write mode
await myFile.write.mode("preserve").text("content"); // Skip if file exists
await myFile.write.mode("overwrite").text("content"); // Default behavior
```

#### Schema Validation

```typescript
import { fsFile } from "@synstack/fs";
import { z } from "zod";

const schema = z.object({ name: z.string() });
const configFile = fsFile("config.json").schema(schema);

// Read with validation
const config = await configFile.read.json();
// Write with validation
await configFile.write.json({ name: "test" });
```

### Directory Operations (FsDir)

Work with directories using the `dir()` function:

#### Basic Operations

```typescript
import { fsDir } from "@synstack/fs";

const myDir = fsDir("/path/to/directory");

// Check existence
await myDir.exists(); // Promise<boolean>
myDir.existsSync(); // boolean

// Create directory
await myDir.make();
myDir.makeSync();

// Remove directory
await myDir.rm();
myDir.rmSync();

// Move directory
await myDir.move("/new/path");
myDir.moveSync("/new/path");
```

#### Path Operations

```typescript
// Get directory information
myDir.path; // "/path/to/directory"
myDir.name(); // "directory"

// Navigate directories
myDir.to("subdirectory"); // New FsDir instance
myDir.toFile("file.txt"); // New FsFile instance

// Relative paths
myDir.relativePathTo(otherDir); // Relative path from this directory to another directory
myDir.relativePathFrom(otherDir); // Relative path from another directory to this directory
```

#### File Finding

```typescript
// Find files using glob patterns
await myDir.glob("**/*.ts", "!**/*.test.ts"); // FsFileArray
myDir.globSync(["**/*.ts", "!**/*.test.ts"]); // FsFileArray
```

#### Git Operations

```typescript
// Get git tracked, modified, and untracked files
await myDir.gitLs();
```

#### Command Execution

```typescript
await myDir.exec`echo "Hello, world!"`;
```

### File Array Operations (FsFileArray)

Work with collections of files using powerful array methods:

```typescript
import { fsDir, fsFiles } from "@synstack/fs";

// Create from directory
const sourceDir = fsDir("./src");
const fileArray = await sourceDir.glob("**/*");

// Create from paths
const customArray = fsFiles(["/path/to/file1.txt", "/path/to/file2.txt"]);

// Filtering
fileArray.filter((file) => file.fileExtension() === ".ts");
fileArray.filterGlobs("**/*.ts", "!**/*.test.ts");
fileArray.filterMimeTypes("text/plain", "application/json");
fileArray.filterDir(someDir);

// Path operations
fileArray.toPaths(); // Array<string>
fileArray.relativePathsTo(someDir); // Array<string>
```
