# @synstack/web

Web utilities for fetching and parsing web content

## What is it for?

This package provides utilities for fetching and parsing web content, including JSON data, plain text, and article extraction:

```typescript
import { fetchJson, fetchText, fetchArticle } from "@synstack/web";

// Fetch and validate JSON data
const data = await fetchJson("https://api.example.com/data", {
  schema: myZodSchema,
});

// Fetch plain text content
const text = await fetchText("https://example.com/content.txt");

// Extract article content
const article = await fetchArticle("https://blog.example.com/post");
console.log(article.title); // Article title
console.log(article.content); // Article HTML content
```

## Installation

```bash
npm install @synstack/web
# or
yarn add @synstack/web
# or
pnpm add @synstack/web
```

## Features

### JSON Fetching

Fetch and validate JSON data with optional schema validation:

```typescript
import { fetchJson } from "@synstack/web";
import { z } from "zod";

// Define a schema for type safety
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// Fetch and validate JSON data
const user = await fetchJson("https://api.example.com/user", {
  schema: userSchema,
});
```

### Text Fetching

Retrieve plain text content from URLs:

```typescript
import { fetchText } from "@synstack/web";

// Fetch text content
const content = await fetchText("https://example.com/content.txt");
```

### Article Extraction

Extract article content from web pages using Mozilla's Readability:

```typescript
import { fetchArticle } from "@synstack/web";

// Extract article content
const article = await fetchArticle("https://blog.example.com/post");

console.log({
  title: article.title, // Article title
  content: article.content, // Article HTML content
  byline: article.byline, // Author information
  siteName: article.siteName, // Website name
  lang: article.lang, // Article language
  publishedTime: article.publishedTime, // Publication time
});
```

### Error Handling

Handle article extraction errors:

```typescript
import { fetchArticle, ArticleNotFoundException } from "@synstack/web";

try {
  const article = await fetchArticle("https://example.com/not-an-article");
} catch (error) {
  if (error instanceof ArticleNotFoundException) {
    console.error("Could not extract article:", error.message);
  }
}
```
