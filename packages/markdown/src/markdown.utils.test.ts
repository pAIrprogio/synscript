import { assertExtends, assertType } from "@shared/ts.utils";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";
import * as md from "./markdown.lib";

describe("Markdown", () => {
  describe("fromHtml", () => {
    it("converts HTML to Markdown", () => {
      const html =
        "<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>";
      const markdown = md.fromHtml(html);
      assert.equal(markdown, "# Hello World\n\nThis is a __test__.");
    });
  });

  describe("getHeaderData", () => {
    it("extracts and parses header data", () => {
      const text = "---\ntitle: Test\ncount: 5\n---\nContent";
      const schema = z.object({ title: z.string(), count: z.number() });
      const data = md.getHeaderData<{ title: string; count: number }>(text, {
        schema,
      });
      assertType<{ title: string; count: number } | undefined>(data);
      assert.deepEqual(data, { title: "Test", count: 5 });
    });
    it("returns undefined if header data is not present", () => {
      const text = "Content";
      const data = md.getHeaderData(text);
      assert.equal(data, undefined);
    });
  });

  describe("setHeaderData", () => {
    it("sets header data in Markdown", () => {
      const text = "---\ntitle: Old\n---\nContent";
      const newData = { title: "New", count: 10 };
      const result = md.setHeaderData(text, newData);
      assert.equal(result, "---\ntitle: New\ncount: 10\n---\nContent");
    });
  });

  describe("getBody", () => {
    it("extracts body from Markdown", () => {
      const text = "---\ntitle: Test\n---\nContent";
      const body = md.getBody(text);
      assert.equal(body, "Content");
    });
    it("returns full text if no header is present", () => {
      const text = "Content";
      const body = md.getBody(text);
      assert.equal(body, "Content");
    });
  });

  describe("setBody", () => {
    it("sets body in Markdown", () => {
      const text = "---\ntitle: Test\n---\nOld Content";
      const newBody = "New Content";
      const result = md.setBody(text, newBody);
      assert.equal(result, "---\ntitle: Test\n---\nNew Content");
    });
    it("replaces body if header is missing", () => {
      const text = "Old Content";
      const newBody = "New Content";
      const result = md.setBody(text, newBody);
      assert.equal(result, "New Content");
    });
  });

  describe("MdDocument", () => {
    describe("MdDocument", () => {
      describe("fromString", () => {
        const _types = () => {
          const doc = md.MdDoc.fromString<{ title: string }>("Content");
          // We need to trust the user with this
          assertExtends<{ title: string }, (typeof doc)["data"]>();
          // @ts-expect-error - This should cause a type error
          doc.setData({ title: 123 });
        };

        it("creates a document from a string with frontmatter", () => {
          const doc = md.MdDoc.fromString("---\ntitle: Test\n---\nContent");
          assert.deepEqual(doc.data, { title: "Test" });
          assert.equal(doc.body, "Content");
        });

        it("creates a document from a string", () => {
          const doc = md.MdDoc.fromString("Content only");
          assert.equal(doc.data, undefined);
          assert.equal(doc.body, "Content only");
        });

        it("creates a document from a string with schema validation", () => {
          const schema = z.object({ title: z.string() });
          const baseDoc = md.MdDoc.withOptions({ schema });
          assert.equal(baseDoc.data, undefined);
          const doc = md.MdDoc.withOptions({ schema }).fromString(
            "---\ntitle: Test\n---\nContent",
          );
          assert.deepEqual(doc.data, { title: "Test" });
          const docWithData = doc.setData({ title: "Test" });
          assert.deepEqual(docWithData.data, { title: "Test" });
        });
      });

      describe("fromHtml", () => {
        const _types = () => {
          const doc = md.MdDoc.fromHtml<{ title: string }>(
            "<h1>Title</h1><p>Content</p>",
          );
          assertExtends<undefined, (typeof doc)["data"]>();
          // @ts-expect-error - This should cause a type error
          doc.setData({ title: 123 });
          assertType<{ title: string }>(doc.setData({ title: "Test" }).data);
        };
        it("creates a document from HTML", () => {
          const doc = md.MdDoc.fromHtml("<h1>Title</h1><p>Content</p>");
          assert.equal(doc.data, undefined);
          assert.equal(doc.body, "# Title\n\nContent");
        });
        it("creates a document from HTML with schema validation", () => {
          const schema = z.object({ title: z.string() });
          const baseDoc = md.MdDoc.withOptions({ schema });
          assert.equal(baseDoc.data, undefined);
          const doc = md.MdDoc.withOptions({ schema }).fromHtml(
            "<h1>Title</h1>",
          );
          assert.equal(doc.data, undefined);
          const docWithData = doc.setData({ title: "Test" });
          assert.deepEqual(docWithData.data, { title: "Test" });
        });
      });

      describe("withOptions", () => {
        it("creates a document with schema validation", () => {
          const schema = z.object({ title: z.string() });
          const doc = md.MdDoc.withOptions({ schema })
            .setData({ title: "Test" })
            .setBody("Content");
          assert.deepEqual(doc.data, { title: "Test" });
          assert.equal(doc.body, "Content");
        });

        it("throws an error when data doesn't match schema", () => {
          const schema = z.object({ title: z.string() });
          const doc = md.MdDoc.withOptions({ schema });
          assertExtends<undefined, (typeof doc)["data"]>();
          assert.throws(() => {
            // @ts-expect-error - This should cause a type error
            doc.setData({ title: 123 });
          });
        });
      });

      describe("setData", () => {
        it("updates data", () => {
          const doc = md.MdDoc.fromString(
            "---\ntitle: Old\n---\nContent",
          ).setData({ title: "New" });
          assert.deepEqual(doc.data, { title: "New" });
          assert.equal(doc.body, "Content");
        });
      });

      describe("setBody", () => {
        it("updates body", () => {
          const doc = md.MdDoc.fromString(
            "---\ntitle: Test\n---\nOld Content",
          ).setBody("New Content");
          assert.deepEqual(doc.data, { title: "Test" });
          assert.equal(doc.body, "New Content");
        });
      });

      describe("toString", () => {
        it("returns the full markdown string", () => {
          const doc = md.MdDoc.fromString("---\ntitle: Test\n---\nContent");
          assert.equal(doc.toString(), "---\ntitle: Test\n---\nContent");
        });
      });
    });
  });
});
