# @synstack/markdown

Type-safe markdown processing with YAML frontmatter support

> [!WARNING]
> This package is included in the [@synstack/synscript](https://github.com/pAIrprogio/synscript) package. It is not recommended to install both packages at the same time.

## What is it for?

Working with markdown documents should be type-safe and intuitive. This package provides tools for converting HTML to markdown, managing YAML frontmatter, and handling markdown content:

```typescript
import { fromHtml, MdDoc } from "@synstack/markdown";

// Convert HTML to markdown
const markdown = fromHtml("<h1>Hello</h1>");
// Returns: "# Hello"

// Work with markdown documents and frontmatter
interface PostFrontmatter {
  title: string;
  date: string;
}

const doc = MdDoc.withOptions({ schema: postSchema }).fromString(`---
title: Hello World
date: 2024-01-01
---
# Content here`);

// Access typed frontmatter data
console.log(doc.data.title); // "Hello World"

// Update content while preserving frontmatter
const updated = doc.setBody("# New content");
```

## Installation

```bash
# Using npm
npm install @synstack/markdown

# Using yarn
yarn add @synstack/markdown

# Using pnpm
pnpm add @synstack/markdown
```

## Features

### HTML to Markdown Conversion

Convert HTML content to markdown with consistent styling:

```typescript
import { fromHtml } from "@synstack/markdown";

const markdown = fromHtml("<h1>Title</h1><p>Content</p>");
// Returns:
// # Title
//
// Content
```

### YAML Frontmatter Handling

Work with YAML frontmatter in markdown documents:

```typescript
import { getHeaderData, setHeaderData } from "@synstack/markdown";

// Extract frontmatter data
const data = getHeaderData("---\ntitle: Hello\n---\n# Content");
// Returns: { title: "Hello" }

// Set frontmatter data
const text = setHeaderData("# Content", { title: "Hello" });
// Returns: "---\ntitle: Hello\n---\n# Content"
```

### Type-safe Document Management (MdDoc)

Handle markdown documents with type-safe frontmatter:

```typescript
import { MdDoc } from "@synstack/markdown";

// Create from markdown string
const doc = MdDoc.fromString(`---
title: Hello
---
# Content`);

// Create from HTML
const htmlDoc = MdDoc.fromHtml("<h1>Title</h1>");

// Update content
const updated = doc
  .setData({ title: "New Title" })
  .setBody("# Updated content");
```
