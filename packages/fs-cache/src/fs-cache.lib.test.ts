import { dir } from "@synstack/fs";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { fsCache } from "./fs-cache.lib.ts";

const TMP_DIR = dir(import.meta.dirname).to("tmp");

describe("FsCache", () => {
  afterEach(async () => {
    // Clean up temp directory after each test
    await TMP_DIR.rm();
  });

  describe("basic caching", () => {
    it("caches function results", async () => {
      const cache = fsCache(TMP_DIR.path).key(["test"]).pretty(true);

      let callCount = 0;
      const fn = cache.fn(async () => {
        callCount++;
        return Promise.resolve("result");
      });

      // First call should execute the function
      const result1 = await fn();
      assert.equal(result1, "result");
      assert.equal(callCount, 1);

      // Second call should use cache
      const result2 = await fn();
      assert.equal(result2, "result");
      assert.equal(callCount, 1);
    });

    it("caches with dynamic keys", async () => {
      const cache = fsCache(TMP_DIR.path).key([(id: number) => `user-${id}`]);

      let callCount = 0;
      const fn = cache.fn(async (id: number) => {
        callCount++;
        return Promise.resolve({ id, name: "Test" });
      });

      // Different keys should cache separately
      const result1 = await fn(1);
      const result2 = await fn(2);
      const result3 = await fn(1); // Should use cache

      assert.deepEqual(result1, { id: 1, name: "Test" });
      assert.deepEqual(result2, { id: 2, name: "Test" });
      assert.deepEqual(result3, { id: 1, name: "Test" });
      assert.equal(callCount, 2);
    });
  });

  describe("get/set operations", () => {
    it("returns miss for non-existent cache", async () => {
      const cache = fsCache(TMP_DIR.path).key(["test"]);
      const [status, value] = await cache.get([]);

      assert.equal(status, "miss");
      assert.equal(value, null);
    });

    it("sets and gets cache values", async () => {
      const cache = fsCache(TMP_DIR.path).key(["test"]);
      const testData = { foo: "bar" };

      await cache.set([], testData);
      const [status, value] = await cache.get([]);

      assert.equal(status, "hit");
      assert.deepEqual(value, testData);
    });

    it("sets default values", async () => {
      const cache = fsCache(TMP_DIR.path).key(["test"]);
      const defaultValue = { default: true };

      // First call should set the default
      await cache.setDefault([], defaultValue);
      const [status1, value1] = await cache.get([]);
      assert.equal(status1, "hit");
      assert.deepEqual(value1, defaultValue);

      // Second call should not override existing value
      await cache.setDefault([], { different: true });
      const [status2, value2] = await cache.get([]);
      assert.equal(status2, "hit");
      assert.deepEqual(value2, defaultValue);
    });
  });

  describe("locking", () => {
    it("locks and unlocks cache entries", async () => {
      const cache = fsCache(TMP_DIR.path).key(["test"]);
      const testData = { foo: "bar" };

      // Set initial data
      await cache.set(["v1"], testData);

      // Lock the cache
      await cache.lock(true, ["v1"]);

      // Even with different input, should return cached value when locked
      const [status, value] = await cache.get(["v2"]);
      assert.equal(status, "hit");
      assert.deepEqual(value, testData);

      // Unlock the cache
      await cache.lock(false, []);

      // Now should return miss with different input
      const [newStatus, _newValue] = await cache.get(["v3"]);
      assert.equal(newStatus, "miss");
    });
  });

  describe("configuration", () => {
    it("respects pretty printing option", async () => {
      const cache = fsCache(TMP_DIR.path).key(["pretty-test"]).pretty(true);

      const testData = { foo: "bar" };
      await cache.set([], testData);

      const cacheFile = TMP_DIR.file("./pretty-test.json");
      const content = await cacheFile.read.text();

      // Should be formatted with 2 spaces
      assert.equal(content.includes("  "), true);
    });
  });

  describe("signatureFn", () => {
    it("uses custom signature function", async () => {
      const cache = fsCache(TMP_DIR.path)
        .key(["test"])
        .signatureFn((num1: number, num2: number) => num1 + num2);

      let callCount = 0;
      const fn = cache.fn(async (num1: number, num2: number) => {
        callCount++;
        return Promise.resolve({ num1, num2 });
      });

      // First call
      await fn(1, 2);
      assert.equal(callCount, 1);

      // Should hit cache since 2+1 equals 1+2
      await fn(2, 1);
      assert.equal(callCount, 1);

      // Should miss cache since 2+2 is different
      await fn(2, 2);
      assert.equal(callCount, 2);
    });

    it("uses default inputSerializer", async () => {
      const cache = fsCache(TMP_DIR.path).key(["test"]);

      let callCount = 0;
      const fn = cache.fn(async (data: { id: string; value: number }) => {
        callCount++;
        return Promise.resolve(data);
      });

      // First call
      await fn({ id: "123", value: 1 });
      assert.equal(callCount, 1);

      // Should hit cache with identical input
      await fn({ id: "123", value: 1 });
      assert.equal(callCount, 1);

      // Should miss cache with different input
      await fn({ id: "123", value: 2 });
      assert.equal(callCount, 2);
    });

    it("supports async inputSerializer", async () => {
      const cache = fsCache(TMP_DIR.path)
        .key(["test"])
        .signatureFn(async (num1: number, num2: number) => {
          return Promise.resolve(num1 + num2);
        });

      let callCount = 0;
      const fn = cache.fn(async (num1: number, num2: number) => {
        callCount++;
        return Promise.resolve({ num1, num2 });
      });

      // First call
      await fn(1, 2);
      assert.equal(callCount, 1);

      // Should hit cache since 2+1 equals 1+2
      await fn(2, 1);
      assert.equal(callCount, 1);

      // Should miss cache since 2+2 is different
      await fn(2, 2);
      assert.equal(callCount, 2);
    });
  });
});
