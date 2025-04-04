# @synstack/git

Git utilities for AI prompting and automation

> [!NOTE]
> The `ls` function is available through [@synstack/fs](../fs/README.md) for convenience.

## What is it for?

This package provides a small set of Git operations commonly needed when working with AI tools and automation scripts:

```typescript
import { ls, show } from "@synstack/git";

// Get all git-relevant files in your project
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
