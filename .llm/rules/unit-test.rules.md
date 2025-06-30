## Test template

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("test", () => {
  it("should do something", () => {
    assert.equal(true, true);
  });
});
```

## Test structure

<rule>Use `describe` to group tests by feature or context.</rule>
<rule>Use `assert.deepEqual` for complex object comparisons.</rule>
