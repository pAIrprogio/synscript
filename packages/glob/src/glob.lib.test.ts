import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { capture } from "./glob.lib.ts";

describe("glob capture", () => {
  it("captures globs", () => {
    assert.deepEqual(capture("**/(*)/(*).ts", "path/to/file.ts"), [
      "to",
      "file",
    ]);
  });
  it("returns null if glob does not match", () => {
    assert.deepEqual(
      capture("**/never/(*)/(*).ts", "path/to/sub/file.ts"),
      null,
    );
  });
});
