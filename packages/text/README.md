# @synstack/text

> String templating as it was meant to be

This is a strongly opinionated implementation of string templating. It's basically JSX for text and solves many quirks of string interpolation and formatting.

## What is it for ?

Turns this:

```ts
import { t } from "@synstack/text";

const items = ["Hello", "World"];

const text: string = await t`
    Value: ${items.join(", ")}
    Promise: ${Promise.resolve(items.join(", "))}

    Callables:
      Callable: ${() => items.join(", ")}
      Callable Promise: ${() => Promise.resolve(items.join(", "))}

    List of items:
      ${() => Promise.resolve(items.map((item) => `- ${item}`))}
`;
```

Into this:

```plain
Value: Hello, World
Promise: Hello, World

Callables:
  Callable: Hello, World
  Callable Promise: Hello, World

List of items:
  - Hello
  - World
```

**What's baked in ?**

- Promises even nested in arrays are resolved in parallel
- Array values are joined with a newline
- Text is trimmed
- Base indentation is removed
- Nested indentation is preserved for multi-line values
- Returned value is either a string or a promise of a string based on interpolated values

## Installation

```bash
npm install @synstack/text
yarn add @synstack/text
```

## Features

### Text formatting

- `t` will automatically trim unecessary whitespaces and indentations. This allows your code to remain indented and readable while still being able to use the template.
- `t` will auto-join array values with a newline.
- `t` will propagate indentation to each line of the nested values.

```ts
const text: string = t`
              Hello
                ${"- Item 1\n- Item 2"}
              World
            `;
```

Will be transformed into:

```plain
Hello
  - Item 1
  - Item 2
World
```

### Async support

- `t` automatically detects if the template is async or not and handles it accordingly.
- When `t` is async, it resolves all values in parralel with a `Promise.all`
- If you want to force serial execution, use an `await` expression.

```ts
const sync: string = t`Hello ${"World"}`;
const async: Promise<string> = t`Hello ${Promise.resolve("World")}`;

/*
Asuming retrieveUserName and retrieveUserEmail are async functions
Both queries will be resolved in parallel 
*/
const async: Promise<string> = t`Hello ${retrieveUserName()} ${retrieveUserEmail()}`;
```

### Callable values

- You can use any function without argument as a template value.
- `t` will call the function and then handle it's `sync` or `async` state through the async support logic.

```ts
/*
Asuming retrieveUserName and retrieveUserEmail are async functions with no arguments
Both queries will be called and resolved in parallel 
*/
const async: Promise<string> = t`Hello ${retrieveUserName} ${retrieveUserEmail}`;
```

### Arrays

- Array values are resolved in parrallel with `Promise.all`
- The resulting strings are joined with a newline
- The indentation is preserved for each line

```ts
const items = [Promise.resolve("Hello"), Promise.resolve("World")];

const text: Promise<string> = t`
  This is a list of items:
    ${items}
`;

console.log(await text);
```

Will output:

```plain
This is a list of items:
  Hello
  World
```

### Extra objects

> [!NOTE]
> This feature was built to seemlessly integrate inline content blocks in LLM messages.
> e.g. Adding images, tool responses, etc.

- `t` is able to handle non-string objects as values. As long as they have a `type` property.
  - The value will be `JSON.stringify`ed and added to the template.
  - The returned value will be `string & { __extra: TExtraObject }`
- The value can then be accessed through the `tParse(resultingString)` property.
- You can constrain the type of the extra object by using a type assertion from `Text.String`
- You can infer the value type of the extra object by using a type assertion from `Text.ExtraObject.Infer`

```ts
import { t, tParse, type Text } from "@pairprog/text";

// @ts-expect-error - The non-matching extra object will be rejected
const textFail: Text.String<{ type: "extra"; value: string }> =
  t`Hello ${{ type: "other-type" as const, value: "Hello" }} World`;

// string & { __extra: { type: "extra"; value: string } } is equivalent to Text.String<{ type: "extra"; value: string }>
const text: string & { __extra: { type: "extra"; value: string } } =
  t`Hello ${{ type: "extra" as const, value: "Hello" }} World`;

console.log(tParse(text));
// ["Hello ", { type: "extra", value: "Hello" }, " World"]
```
