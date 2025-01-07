# @synstack/xml

Non-iso XML parser with text preservation and invalid XML handling

> [!WARNING]
> This package is included in the [@synstack/synscript](../synscript/README.md) package. It is not recommended to install both packages at the same time.

## What is it for?

This package provides a simple XML parser that preserves the original text and handles invalid XML gracefully:

```typescript
import { parse, nodesToText } from "@synstack/xml";

// Parse XML content
const nodes = parse(`
  <root attr="value">
    <child>Content</child>
    <invalid>
  </root>
`);

// Access parsed nodes
console.log(nodes[0].type); // "tag"
console.log(nodes[0].tag); // "root"
console.log(nodes[0].attrs); // { attr: "value" }
console.log(nodes[0].content); // Array of child nodes

// Convert nodes back to text
const text = nodesToText(nodes);
```

## Installation

```bash
npm install @synstack/xml
# or
yarn add @synstack/xml
# or
pnpm add @synstack/xml
```

## Features

### XML Parsing

Parse XML content into a tree structure while preserving original text:

```typescript
import { parse } from "@synstack/xml";

const nodes = parse(`
  <root>
    <child attr="value">Content</child>
    <self-closing/>
  </root>
`);

// Parsed structure maintains all original text
console.log(nodes[0].text); // Original XML text
console.log(nodes[0].content[0].text); // Original child text
```

### Invalid XML Handling

The parser handles invalid XML by treating unclosed tags as text:

```typescript
import { parse } from "@synstack/xml";

const nodes = parse(`
  <root>
    <unclosed>Content
    <valid>Valid Content</valid>
  </root>
`);

// Unclosed tags become text nodes
console.log(nodes[0].content[0].type); // "text"
console.log(nodes[0].content[0].text); // "<unclosed>Content"
```

### Text Reconstruction

Convert parsed nodes back to their original text:

```typescript
import { parse, nodesToText } from "@synstack/xml";

const xml = `<root><child>Content</child></root>`;
const nodes = parse(xml);
const text = nodesToText(nodes);

console.log(text === xml); // true
```