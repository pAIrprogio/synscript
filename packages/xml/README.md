# @synstack/xml

Non-iso XML parser with text preservation

## What is it for?

This package provides a simple XML parser that preserves the original text formatting and handles invalid XML gracefully:

```typescript
import { parse } from "@synstack/xml";

// Parse XML content
const nodes = parse(`
  <root attr="value">
    <child>Content</child>
    <invalid>Unclosed tag
  </root>
`);

// Access parsed nodes with preserved text
console.log(nodes[0].text); // Original XML text including whitespace
console.log(nodes[0].content[0].text); // Text content with preserved formatting
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

Parse XML content while preserving text and handling invalid XML:

```typescript
import { parse } from "@synstack/xml";

const nodes = parse(`
  <root>
    <child attr="value">Content</child>
    <self-closing/>
  </root>
`);

// Access node properties
console.log(nodes[0].tag); // "root"
console.log(nodes[0].content[0].tag); // "child"
console.log(nodes[0].content[0].attrs); // { attr: "value" }
```

### Invalid XML Handling

The parser gracefully handles invalid XML by treating problematic tags as text:

```typescript
// Mismatched tags become text
const result = parse("<file><a>text</b></file>");
// Result:
// [{
//   type: "tag",
//   tag: "file",
//   content: [{ type: "text", text: "<a>text</b>" }],
//   text: "<file><a>text</b></file>"
// }]

// Unclosed tags become text
const result2 = parse("<root><child>Content</child><root>");
// Result:
// [{
//   type: "text",
//   text: "<root><child>Content</child><root>"
// }]
```

### Text Reconstruction

Convert parsed nodes back to text while preserving the original formatting:

```typescript
import { parse, nodesToText } from "@synstack/xml";

const nodes = parse("<root>Content</root>");
const text = nodesToText(nodes);
console.log(text); // "<root>Content</root>"
```
