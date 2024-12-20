import { writeFile } from "fs/promises";
import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { rm } from "node:fs/promises";
import { ls, show } from "./git.lib.ts";

describe("git", () => {
  describe("show", () => {
    it("shows a commit", async (t) => {
      const commit = await show(
        "449b7730436026243936a0a2f37c6d3474fcad3b",
        ".",
      );
      t.assert.snapshot(commit);
    });
  });

  describe("ls", () => {
    it("lists git-included files in a directory", async () => {
      const files = await ls("./test-dir");
      assert.deepEqual(files, [".gitignore", "file-1"]);
    });

    it("doesn't list ignored files", async (t) => {
      t.after(async () => {
        await rm("./test-dir/ignored-1");
      });

      await writeFile("./test-dir/ignored-1", "test");
      const files = await ls("./test-dir");
      assert.deepEqual(files, [".gitignore", "file-1"]);
    });

    it("lists untracked files", async (t) => {
      t.after(async () => {
        await rm("./test-dir/file-2");
      });

      await writeFile("./test-dir/file-2", "test");
      const files = await ls("./test-dir");
      assert.deepEqual(files, [".gitignore", "file-1", "file-2"]);
    });
  });
});
