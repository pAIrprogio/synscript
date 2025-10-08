## Test template

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("test", () => {
  it("does something", () => {
    assert.equal(true, true);
  });
});
```

## Test structure

<rule>Use `describe` to group tests by feature or context.</rule>
<rule>Use `assert.deepEqual` for complex object comparisons.</rule>
<rule>Write the minimum amount of tests to cover the intended behaviors.</rule>
