import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertType } from "../../shared/src/ts.utils.ts";
import { type Str, str } from "./str.chainable.ts";

describe("Str", () => {
  const _types = () => {
    assertType<Str>(str("Hello World")._((t) => t.chopEmptyLinesStart()));
    assertType<string>(str("Hello World").$);
    assertType<number>(str("Hello World")._$((t) => t.length).$);
    assertType<Promise<string>>(
      str("Hello World")._$((t) => Promise.resolve(t)),
    );
    assertType<Promise<Str>>(str("Hello World")._((t) => Promise.resolve(t)));
  };

  describe("from", () => {
    it("can be created from a string", () => {
      const value = str("Hello World").str;
      assert.equal(value, "Hello World");
    });
  });

  describe("trim", () => {
    it("trims the text", () => {
      const value = str("  Hello World  ").trim().str;
      assert.equal(value, "Hello World");
    });
  });

  describe("trimStart", () => {
    it("trims the start of the text", () => {
      const value = str(" \n  Hello World  ").trimStart().str;
      assert.equal(value, "Hello World  ");
    });
  });

  describe("trimEnd", () => {
    it("trims the end of the text", () => {
      const value = str("  Hello World  \n ").trimEnd().str;
      assert.equal(value, "  Hello World");
    });
  });

  describe("trimEmptyLines", () => {
    it("trims the empty lines at start and end", () => {
      const value = str(
        `  
  Hello
  
World  
  `,
      ).trimEmptyLines().str;
      assert.equal(value, "\n  Hello\n\nWorld  \n");
    });
  });

  describe("split", () => {
    it("splits the text", () => {
      const value = str("Hello World").split(" ");
      assert.equal(value.length, 2);
      assert.equal(value.at(0)?.str, "Hello");
      assert.equal(value.at(1)?.str, "World");
    });
  });

  describe("indent", () => {
    it("indents the text", () => {
      const value = str("Hello World").indent(2).str;
      assert.equal(value, "  Hello World");
    });

    it("indents multiple lines", () => {
      const value = str("Hello\nWorld").indent(2).str;
      assert.equal(value, "  Hello\n  World");
    });
  });

  describe("lastLine", () => {
    it("returns the last line", () => {
      const value = str("Hello\nWorld");
      assert.equal(value.lastLine().str, "World");
    });
  });

  describe("firstLine", () => {
    it("returns the first line", () => {
      const value = str("Hello\nWorld");
      assert.equal(value.firstLine().str, "Hello");
    });
  });

  describe("indentation", () => {
    it("returns the min indentation", () => {
      const value = str("  Hello\n World");
      assert.equal(value.indentation(), 1);
    });

    it("returns 0 for empty text", () => {
      const value = str("");
      assert.equal(value.indentation(), 0);
    });

    it("ignores empty lines", () => {
      const value = str("\n\n \n  Hello\n   \n  World");
      assert.equal(value.indentation(), 2);
    });
  });

  describe("chopStart", () => {
    it("chops the start of the text", () => {
      const value = str("Hello World").chopStart(6).str;
      assert.equal(value, "World");
    });

    it("handles out of bounds", () => {
      const value = str("Hello World").chopStart(20).str;
      assert.equal(value, "");
    });

    it("handles 0", () => {
      const value = str("Hello World").chopStart(0).str;
      assert.equal(value, "Hello World");
    });
  });

  describe("chopEnd", () => {
    it("chops the end of the text", () => {
      const value = str("Hello World").chopEnd(6).str;
      assert.equal(value, "Hello");
    });

    it("handles out of bounds", () => {
      const value = str("Hello World").chopEnd(20).str;
      assert.equal(value, "");
    });

    it("handles 0", () => {
      const value = str("Hello World").chopEnd(0).str;
      assert.equal(value, "Hello World");
    });
  });

  describe("takeStart", () => {
    it("takes the start of the text", () => {
      const value = str("Hello World").takeStart(5).str;
      assert.equal(value, "Hello");
    });

    it("handles out of bounds", () => {
      const value = str("Hello World").takeStart(20).str;
      assert.equal(value, "Hello World");
    });
  });

  describe("takeEnd", () => {
    it("takes the end of the text", () => {
      const value = str("Hello World").takeEnd(5).str;
      assert.equal(value, "World");
    });

    it("handles out of bounds", () => {
      const value = str("Hello World").takeEnd(20).str;
      assert.equal(value, "Hello World");
    });
  });

  describe("dedent", () => {
    it("dedents the text", () => {
      const value = str("  Hello\n   World").dedent().str;
      assert.equal(value, "Hello\n World");
    });
    it("ignores empty lines when counting indentation", () => {
      const value = str("\n\n \n   Hello\n   \n  World").dedent().str;
      assert.equal(value, "\n\n\n Hello\n \nWorld");
    });
    it("only dedents whitespace", () => {
      const value = str("  Hello\n   World").dedent(8).str;
      assert.equal(value, "Hello\nWorld");
    });
  });

  describe("chopEmptyLinesStart", () => {
    it("trims the start of the lines", () => {
      const value = str("\n\n  \n  Hello").chopEmptyLinesStart().str;
      assert.equal(value, "  Hello");
    });
  });

  describe("chopEmptyLinesEnd", () => {
    it("trims the end of the lines", () => {
      const value = str("Hello  \n   \n  ").chopEmptyLinesEnd().str;
      assert.equal(value, "Hello  ");
    });
  });

  describe("trimEachLineTrailingSpaces", () => {
    it("removes trailing spaces on each line", () => {
      const value = str(
        `  
  Hello
     
World
  `,
      ).trimLinesTrailingSpaces().str;
      assert.equal(value, "\n  Hello\n\nWorld\n");
    });
  });

  describe("chopRepeatNewlines", () => {
    it("chops repeated newlines", () => {
      const value = str(
        `Hello




World`,
      ).chopRepeatNewlines(2).str;
      assert.equal(value, "Hello\n\nWorld");
    });

    it("goes down to single newlines", () => {
      const value = str(`Hello\n\n\nWorld`).chopRepeatNewlines(1).str;
      assert.equal(value, "Hello\nWorld");
    });
  });

  describe("replace", () => {
    it("replaces first occurrence with string pattern", () => {
      const value = str("Hello World").replace("o", "0").str;
      assert.equal(value, "Hell0 World");
    });

    it("replaces first occurrence with regex pattern", () => {
      const value = str("abc abc").replace(/[a-z]/, "X").str;
      assert.equal(value, "Xbc abc");
    });
  });

  describe("replaceAll", () => {
    it("replaces all occurrences with string pattern", () => {
      const value = str("Hello World").replaceAll("o", "0").str;
      assert.equal(value, "Hell0 W0rld");
    });

    it("replaces all occurrences with regex pattern", () => {
      const value = str("abc abc").replaceAll(/[a-z]/g, "X").str;
      assert.equal(value, "XXX XXX");
    });

    it("adds global flag to regex if missing", () => {
      const value = str("abc abc").replaceAll(/[a-z]/, "X").str;
      assert.equal(value, "XXX XXX");
    });
  });
});
