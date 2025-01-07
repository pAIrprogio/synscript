# @synstack/reforge

Type-safe VSCode extension API for TS scripts

> [!WARNING]  
> This package is included in the [@synstack/synscript](../synscript/README.md) package. It is not recommended to install both packages at the same time.

> [!NOTE]  
> The reforge VSCode extension is currently in alpha.
>
> If you're interested in using it, please contact contact@pairprog.io to request access.

## What is it for?

This package provides a type-safe interface for interacting with VSCode through the reforge extension. It enables scripts to seamlessly integrate with the editor through a type-safe API:

```typescript
import { reforge } from "@synstack/reforge";

// Get active file information
const filePath = await reforge.getFocusedFile();
const selections = await reforge.getFocusedFileSelections();

// File management
await reforge.openFile({
  path: "/path/to/file.ts",
  config: { preview: true },
});

// User interactions
const choice = await reforge.promptSelect({
  title: "Select an option",
  options: ["Option 1", "Option 2"],
});

await reforge.notify({
  title: "Success",
  message: "Operation completed",
  type: "info",
});
```

## Installation

```bash
npm install @synstack/reforge
# or
yarn add @synstack/reforge
# or
pnpm add @synstack/reforge
```

## Features

### File Operations

#### Active File Information

```typescript
// Get focused file path
const filePath = await reforge.getFocusedFile();

// Get active selections
const selections = await reforge.getFocusedFileSelections();

// Get all opened files
const openedFiles = await reforge.getOpenedFiles();
```

#### File Management

```typescript
// Open a single file
await reforge.openFile({
  path: "/path/to/file.ts",
  config: {
    preview: true,
    force: false,
    column: "beside",
  },
});

// Open multiple files
await reforge.openFiles({
  paths: ["/path/to/file1.ts", "/path/to/file2.ts"],
  config: { column: "active" },
});
```

### User Interactions

#### Prompts

```typescript
// Single selection
const choice = await reforge.promptSelect({
  title: "Select an option",
  options: ["Option 1", "Option 2"],
  placeHolder: "Choose...",
});

// Multiple selection
const choices = await reforge.promptMultiSelect({
  title: "Select options",
  options: ["Option 1", "Option 2"],
  placeHolder: "Choose multiple...",
});

// Text input
const input = await reforge.promptInput({
  title: "Enter value",
  prompt: "Please provide a value",
  defaultValue: "default",
  isPassword: false,
});
```

#### Notifications

```typescript
// Display notification
const clicked = await reforge.notify({
  title: "Operation Status",
  message: "Task completed successfully",
  type: "info", // "info" | "warning" | "error"
  buttons: ["OK", "Cancel"],
});
```

### VSCode Commands

Execute any VSCode command with type safety:

```typescript
import { reforge } from "@synstack/reforge";

// Execute VSCode command
await reforge.vscode.executeCommand({
  command: "workbench.action.files.save",
  args: [
    {
      type: "path",
      value: "/path/to/file.ts",
    },
  ],
});
```
